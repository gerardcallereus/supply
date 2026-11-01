import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CoreSim, GAME_LEVELS } from './engine/CoreSim';
import { Renderer } from './engine/Renderer';
import { HUD } from './components/HUD';
import { EducationalTooltip } from './components/EducationalTooltip';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { TutorialModal } from './components/TutorialModal';
import { LevelUpModal } from './components/LevelUpModal';
import { ModeSelectModal } from './components/ModeSelectModal';
import { 
  LineVoltage, 
  Language, 
  GridNode, 
  PowerLine, 
  InteractionState, 
  Point, 
  UpgradeType,
  LevelInfo,
  ToolMode,
  HydroMode,
  MarketItemType,
  GameDifficulty
} from './types';
import { dist, distToSegment } from './utils/geometry';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<CoreSim | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Pan state
  const isPanningRef = useRef<boolean>(false);
  const lastPanPosRef = useRef<Point | null>(null);

  // React state for UI triggers
  const [lang, setLang] = useState<Language>('ca');
  const [selectedTool, setSelectedTool] = useState<ToolMode>('MAT');
  const [speed, setSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isWeeklyUpgradeOpen, setIsWeeklyUpgradeOpen] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [levelUpModal, setLevelUpModal] = useState<any>(null);
  const [isModeSelectOpen, setIsModeSelectOpen] = useState<boolean>(true);

  // Telemetry snapshot for React HUD
  const [nodes, setNodes] = useState<GridNode[]>([]);
  const [lines, setLines] = useState<PowerLine[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [gameOver, setGameOver] = useState<any>({ isOver: false, reason: null, stats: {} });

  // Tooltip & Hover state
  const [hoverNode, setHoverNode] = useState<GridNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoverLine, setHoverLine] = useState<PowerLine | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startNode: GridNode | null;
    currentWorldPos: Point | null;
  } | null>(null);

  // Interaction State
  const interactionRef = useRef<InteractionState>({
    isDragging: false,
    dragMode: 'DRAW_LINE',
    selectedVoltage: 'MAT',
    dragStartNodeId: null,
    dragCurrentWorldPos: null,
    hoverNodeId: null,
    hoverLineId: null,
    selectedLineId: null,
  });

  // Initialize simulation and renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const sim = new CoreSim();
    const renderer = new Renderer(canvasRef.current);
    simRef.current = sim;
    rendererRef.current = renderer;

    const handleResize = () => {
      renderer.resize();
    };
    window.addEventListener('resize', handleResize);

    // Keyboard shortcuts: 1 for MAT 400 kV, 2 for Distribution 25 kV, 3 for Delete/Scissors, 4 for Battery
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        setSelectedTool('MAT');
      } else if (e.key === '2') {
        setSelectedTool('DISTRIBUTION');
      } else if (e.key === '3' || e.key === 'x' || e.key === 'X') {
        setSelectedTool('DELETE');
      } else if (e.key === '4' || e.key === 'b' || e.key === 'B') {
        setSelectedTool('BATTERY');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (interactionRef.current.hoverLineId && simRef.current) {
          simRef.current.removeLine(interactionRef.current.hoverLineId);
        }
      } else if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        if (simRef.current) {
          simRef.current.isPaused = !simRef.current.isPaused;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    lastTimeRef.current = performance.now();
    let uiSyncTimer = 0.2; // Sync immediately on first frame

    // 60 FPS Game Loop (Canvas renders at 60 FPS; React HUD syncs at ~10 Hz to save CPU/battery)
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      sim.update(dt);
      renderer.render(sim, interactionRef.current, dt);

      uiSyncTimer += dt;
      if (uiSyncTimer >= 0.10 || sim.levelUpModal?.show || sim.gameOver.isOver) {
        uiSyncTimer = 0;

        if (sim.levelUpModal?.show) {
          setLevelUpModal((prev: any) => prev || sim.levelUpModal?.level);
        }

        if (sim.gameOver.isOver) {
          setGameOver((prev: any) => (prev.isOver ? prev : { ...sim.gameOver }));
        }

        setCurrentLevel(sim.currentLevel);
        setNodes([...sim.nodes]);
        setLines([...sim.lines]);
        setTelemetry({ ...sim.telemetry });
        setWeather({ ...sim.weather });
        setInventory({ ...sim.inventory });
        setIsPaused(sim.isPaused);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (selectedTool === 'MAT' || selectedTool === 'DISTRIBUTION') {
      interactionRef.current.selectedVoltage = selectedTool;
    }
  }, [selectedTool]);

  // Helper to find node under world coordinates (increased hit area to 32px for effortless clicking)
  const getNodeAt = useCallback((worldPos: Point, tolerance: number = 32): GridNode | null => {
    if (!simRef.current) return null;
    for (const node of simRef.current.nodes) {
      if (dist(worldPos, node.pos) <= tolerance) {
        return node;
      }
    }
    return null;
  }, []);

  const getLineNear = useCallback((worldPos: Point, tolerance: number = 28): PowerLine | null => {
    if (!simRef.current) return null;
    for (const line of simRef.current.lines) {
      const n1 = simRef.current.nodes.find(n => n.id === line.nodeIds[0]);
      const n2 = simRef.current.nodes.find(n => n.id === line.nodeIds[1]);
      if (n1 && n2) {
        if (distToSegment(worldPos, n1.pos, n2.pos) <= tolerance) {
          return line;
        }
      }
    }
    return null;
  }, []);

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (!rendererRef.current || !simRef.current) return;
    const renderer = rendererRef.current;
    const sim = simRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(0.65, Math.min(4.0, renderer.camera.zoom * zoomFactor));
    
    // Zoom toward mouse pointer
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const sOld = renderer.baseScale * renderer.camera.zoom;
    const sNew = renderer.baseScale * newZoom;
    const centerScreenX = renderer.width / 2;
    const centerScreenY = renderer.height / 2;

    const worldX = renderer.camera.targetX + (mouseX - centerScreenX) / sOld;
    const worldY = renderer.camera.targetY + (mouseY - centerScreenY) / sOld;

    const newTargetX = worldX - (mouseX - centerScreenX) / sNew;
    const newTargetY = worldY - (mouseY - centerScreenY) / sNew;

    renderer.camera.zoom = newZoom;
    renderer.camera.targetX = newTargetX;
    renderer.camera.targetY = newTargetY;
    sim.targetCamera.zoom = newZoom;
    sim.targetCamera.targetX = newTargetX;
    sim.targetCamera.targetY = newTargetY;
  };

  const handleZoomIn = () => {
    if (!rendererRef.current || !simRef.current) return;
    const newZoom = Math.min(4.0, rendererRef.current.camera.zoom * 1.25);
    rendererRef.current.camera.zoom = newZoom;
    simRef.current.targetCamera.zoom = newZoom;
  };

  const handleZoomOut = () => {
    if (!rendererRef.current || !simRef.current) return;
    const newZoom = Math.max(0.65, rendererRef.current.camera.zoom * 0.8);
    rendererRef.current.camera.zoom = newZoom;
    simRef.current.targetCamera.zoom = newZoom;
  };

  const handleResetZoom = () => {
    if (!rendererRef.current || !simRef.current) return;
    const curLevel = simRef.current.currentLevel;
    const lvlCamera = GAME_LEVELS[curLevel - 1]?.camera || { targetX: 940, targetY: 712, zoom: 2.7 };
    rendererRef.current.camera.targetX = lvlCamera.targetX;
    rendererRef.current.camera.targetY = lvlCamera.targetY;
    rendererRef.current.camera.zoom = lvlCamera.zoom;
    simRef.current.targetCamera = { ...lvlCamera };
  };

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!rendererRef.current || !simRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = rendererRef.current.screenToWorld(screenX, screenY);

    // Right click: Delete line or Pan map
    if (e.button === 2) {
      const clickedLine = getLineNear(worldPos, 28);
      if (clickedLine) {
        simRef.current.removeLine(clickedLine.id);
        simRef.current.spawnParticle(worldPos.x, worldPos.y, '#EF4444', 'OVERLOAD');
        setLines([...simRef.current.lines]);
        setInventory({ ...simRef.current.inventory });
        setTelemetry({ ...simRef.current.telemetry });
        return;
      }
      isPanningRef.current = true;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Battery tool: Click on Substation or Consumer to install/uninstall BESS
    if (selectedTool === 'BATTERY') {
      const clickedNode = getNodeAt(worldPos);
      if (clickedNode) {
        simRef.current.toggleBatteryOnNode(clickedNode.id);
        setNodes([...simRef.current.nodes]);
        setInventory({ ...simRef.current.inventory });
        setTelemetry({ ...simRef.current.telemetry });
        return;
      }
    }

    // Scissors tool (Mode Desmuntar): Click on line to delete, or on node to uninstall battery
    if (selectedTool === 'DELETE') {
      const clickedNode = getNodeAt(worldPos);
      if (clickedNode && ((clickedNode.batteryCount || 0) > 0 || clickedNode.hasBattery)) {
        simRef.current.removeBatteryFromNode(clickedNode.id);
        setNodes([...simRef.current.nodes]);
        setInventory({ ...simRef.current.inventory });
        setTelemetry({ ...simRef.current.telemetry });
        return;
      }

      const clickedLine = getLineNear(worldPos, 28);
      if (clickedLine) {
        simRef.current.removeLine(clickedLine.id);
        simRef.current.spawnParticle(worldPos.x, worldPos.y, '#EF4444', 'OVERLOAD');
        setLines([...simRef.current.lines]);
        setInventory({ ...simRef.current.inventory });
        setTelemetry({ ...simRef.current.telemetry });
        return;
      }
    }

    const clickedNode = getNodeAt(worldPos);
    if (clickedNode) {
      setSelectedNodeId(clickedNode.id);
    } else if (!getLineNear(worldPos, 28)) {
      setSelectedNodeId(null);
    }

    if (clickedNode) {
      // If battery or delete tool active, don't start dragging cables
      if (selectedTool === 'BATTERY' || selectedTool === 'DELETE') {
        return;
      }

      // Start cable drag
      interactionRef.current.isDragging = true;
      interactionRef.current.dragStartNodeId = clickedNode.id;
      interactionRef.current.dragCurrentWorldPos = worldPos;
      setDragState({
        isDragging: true,
        startNode: clickedNode,
        currentWorldPos: worldPos,
      });
    } else {
      // Empty ground drag starts pan
      isPanningRef.current = true;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!rendererRef.current || !simRef.current) return;
    const renderer = rendererRef.current;

    // Pan map
    if (isPanningRef.current && lastPanPosRef.current) {
      const dx = e.clientX - lastPanPosRef.current.x;
      const dy = e.clientY - lastPanPosRef.current.y;
      const s = renderer.baseScale * renderer.camera.zoom;
      renderer.camera.targetX -= dx / s;
      renderer.camera.targetY -= dy / s;
      simRef.current.targetCamera.targetX = renderer.camera.targetX;
      simRef.current.targetCamera.targetY = renderer.camera.targetY;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = renderer.screenToWorld(screenX, screenY);

    setMouseScreenPos({ x: e.clientX, y: e.clientY });

    if (interactionRef.current.isDragging) {
      interactionRef.current.dragCurrentWorldPos = worldPos;
      setDragState(prev => prev ? { ...prev, currentWorldPos: worldPos } : null);
    }

    const hoveredNode = getNodeAt(worldPos);
    interactionRef.current.hoverNodeId = hoveredNode ? hoveredNode.id : null;
    setHoverNode(hoveredNode);

    if (!hoveredNode) {
      const hoveredL = getLineNear(worldPos);
      interactionRef.current.hoverLineId = hoveredL ? hoveredL.id : null;
      setHoverLine(hoveredL);
    } else {
      interactionRef.current.hoverLineId = null;
      setHoverLine(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!rendererRef.current || !simRef.current) return;

    if (isPanningRef.current) {
      isPanningRef.current = false;
      lastPanPosRef.current = null;
    }

    if (interactionRef.current.isDragging && interactionRef.current.dragStartNodeId) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = rendererRef.current.screenToWorld(screenX, screenY);

      const targetNode = getNodeAt(worldPos);

      if (targetNode && targetNode.id !== interactionRef.current.dragStartNodeId) {
        if (selectedTool === 'MAT' || selectedTool === 'DISTRIBUTION') {
          const result = simRef.current.addLine(
            selectedTool, 
            [interactionRef.current.dragStartNodeId, targetNode.id]
          );

          if (result.success) {
            simRef.current.spawnParticle(targetNode.pos.x, targetNode.pos.y, '#38BDF8', 'CONVERTER');
          }
          setLines([...simRef.current.lines]);
          setInventory({ ...simRef.current.inventory });
          setTelemetry({ ...simRef.current.telemetry });
        }
      }
    }

    interactionRef.current.isDragging = false;
    interactionRef.current.dragStartNodeId = null;
    interactionRef.current.dragCurrentWorldPos = null;
    setDragState(null);
  };

  const handleTogglePause = () => {
    if (simRef.current) {
      simRef.current.isPaused = !simRef.current.isPaused;
      setIsPaused(simRef.current.isPaused);
    }
  };

  const handleSetSpeed = (s: number) => {
    if (simRef.current) {
      simRef.current.speedMultiplier = s;
      simRef.current.isPaused = false;
      setSpeed(s);
      setIsPaused(false);
    }
  };

  const handleApplyUpgrade = (type: UpgradeType) => {
    if (simRef.current) {
      simRef.current.applyUpgrade(type);
      setIsWeeklyUpgradeOpen(false);
    }
  };

  const handleRestart = () => {
    if (simRef.current) {
      simRef.current.reset();
      setGameOver({ isOver: false, reason: null, stats: {} });
      setIsWeeklyUpgradeOpen(false);
      setIsPaused(true);
      setCurrentLevel(1);
      setIsModeSelectOpen(true);
      handleResetZoom();
    }
  };

  const handleSelectMode = (mode: GameDifficulty) => {
    if (simRef.current) {
      simRef.current.setDifficulty(mode);
      simRef.current.isPaused = true;
      setTelemetry({ ...simRef.current.telemetry });
    }
    setIsPaused(true);
    setIsModeSelectOpen(false);
  };

  const handleSetGeneratorThrottle = (nodeId: string, throttle: number) => {
    if (simRef.current) {
      simRef.current.setGeneratorThrottle(nodeId, throttle);
      setNodes([...simRef.current.nodes]);
    }
  };

  const handleSetHydroMode = (nodeId: string, mode: HydroMode) => {
    if (simRef.current) {
      simRef.current.setHydroMode(nodeId, mode);
      setNodes([...simRef.current.nodes]);
    }
  };

  const handleBuyMarketItem = (item: MarketItemType) => {
    if (simRef.current) {
      simRef.current.buyMarketItem(item);
      setInventory({ ...simRef.current.inventory });
      setTelemetry({ ...simRef.current.telemetry });
      setNodes([...simRef.current.nodes]);
    }
  };

  const handleToggleDemandResponse = (nodeId: string) => {
    if (simRef.current) {
      simRef.current.toggleIndustrialDemandResponse(nodeId);
      setNodes([...simRef.current.nodes]);
      setTelemetry({ ...simRef.current.telemetry });
    }
  };

  const handleSetDifficulty = (diff: any) => {
    if (simRef.current) {
      simRef.current.setDifficulty(diff);
      setTelemetry({ ...simRef.current.telemetry });
    }
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none bg-[#F5F2EB] dark:bg-[#12161F]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute inset-0 block cursor-crosshair active:cursor-grabbing touch-none"
      />

      {/* Top and Right Column HUD */}
      {telemetry && weather && inventory && (
        <HUD
          currentLevel={currentLevel}
          telemetry={telemetry}
          weather={weather}
          inventory={inventory}
          nodes={nodes}
          onSetGeneratorThrottle={handleSetGeneratorThrottle}
          onSetHydroMode={handleSetHydroMode}
          onBuyMarketItem={handleBuyMarketItem}
          onToggleDemandResponse={handleToggleDemandResponse}
          onSetDifficulty={handleSetDifficulty}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          speed={speed}
          onSetSpeed={handleSetSpeed}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          isFranceConnected={simRef.current ? simRef.current.isFranceInterconnConnected() : false}
        />
      )}

      {/* Floating Zoom & Pan Controls on bottom-left (clean, non-overlapping horizontal pill) */}
      <div className="fixed bottom-3 left-3 z-40 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          title="Apropar el mapa (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          title="Allunyar el mapa (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          title="Restablir vista general"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Educational Tooltips, Node Inspector & Cable Reserves in Left Column */}
      <EducationalTooltip
        hoverNode={hoverNode}
        selectedNode={selectedNodeId ? (simRef.current?.nodes.find(n => n.id === selectedNodeId) || null) : null}
        onDeselectNode={() => setSelectedNodeId(null)}
        hoverLine={hoverLine}
        lines={lines}
        nodes={nodes}
        onRemoveLine={(lineId) => {
          if (simRef.current) {
            simRef.current.removeLine(lineId);
            setLines([...simRef.current.lines]);
            setInventory({ ...simRef.current.inventory });
            setTelemetry({ ...simRef.current.telemetry });
          }
        }}
        onReinforceLine={(lineId) => {
          if (simRef.current) {
            simRef.current.reinforceLine(lineId);
            setLines([...simRef.current.lines]);
            setInventory({ ...simRef.current.inventory });
            setTelemetry({ ...simRef.current.telemetry });
          }
        }}
        onRemoveBattery={(nodeId) => {
          if (simRef.current) {
            simRef.current.removeBatteryFromNode(nodeId);
            setNodes([...simRef.current.nodes]);
            setInventory({ ...simRef.current.inventory });
            setTelemetry({ ...simRef.current.telemetry });
          }
        }}
        dragState={dragState}
        selectedTool={selectedTool}
        lang={lang}
        budgetEuros={telemetry?.budgetEuros ?? 0}
        inventory={inventory ?? { matKmTotal: 0, matKmUsed: 0, distKmTotal: 0, distKmUsed: 0, batteriesTotal: 0, batteriesUsed: 0 }}
        onInstallNodeUpgrade={(nodeId, type) => {
          if (simRef.current) {
            const ok = simRef.current.installUpgradeOnNode(nodeId, type);
            setNodes([...simRef.current.nodes]);
            setInventory({ ...simRef.current.inventory });
            setTelemetry({ ...simRef.current.telemetry });
            return ok;
          }
          return false;
        }}
        onBuyCable={(voltage) => {
          if (simRef.current) {
            simRef.current.buyMarketItem(voltage === 'MAT' ? 'BUY_MAT_KM' : 'BUY_DIST_KM');
            setInventory({ ...simRef.current.inventory });
            setTelemetry({ ...simRef.current.telemetry });
          }
        }}
        onToggleDemandResponse={handleToggleDemandResponse}
        onSetGeneratorThrottle={handleSetGeneratorThrottle}
        onSetHydroMode={handleSetHydroMode}
      />

      {/* Sunday Weekly Upgrade Modal */}
      <UpgradeModal
        isOpen={isWeeklyUpgradeOpen}
        onSelectUpgrade={handleApplyUpgrade}
        lang={lang}
      />

      {/* Game Over Screen with Physics Explanation */}
      <GameOverModal
        gameOver={gameOver}
        onRestart={handleRestart}
        lang={lang}
      />

      {/* How to Play / Science Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        lang={lang}
      />

      {/* Level Up & Expansion Modal */}
      <LevelUpModal
        levelInfo={levelUpModal}
        onContinue={() => {
          if (simRef.current) {
            simRef.current.dismissLevelUp();
            setIsPaused(simRef.current.isPaused);
          }
          setLevelUpModal(null);
        }}
        lang={lang}
      />
      {/* Mode Selection Modal at game start */}
      <ModeSelectModal
        isOpen={isModeSelectOpen}
        onSelectMode={handleSelectMode}
      />
    </div>
  );
};
