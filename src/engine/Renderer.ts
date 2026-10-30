import { 
  GridNode, 
  PowerLine, 
  EnergyPacket, 
  SparkParticle, 
  Point, 
  InteractionState 
} from '../types';
import { CONFIG, THEME } from '../constants';
import { 
  CATALUNYA_COMARCAS 
} from '../utils/catalunyaComarcasData';
import { 
  CATALUNYA_RIVERS, 
  PYRENEES_BARRIER, 
  MAP_BASE_WIDTH, 
  MAP_BASE_HEIGHT 
} from '../utils/catalunyaGeography';
import { lerp, linesIntersect } from '../utils/geometry';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  width: number = 0;
  height: number = 0;
  
  // Camera transform for interactive Pan & Zoom (centers on world target coordinates)
  camera = {
    targetX: 920,
    targetY: 712,
    zoom: 3.3,
  };
  
  baseScale: number = 1.0;
  baseOffsetX: number = 0;
  baseOffsetY: number = 0;
  
  private windTurbineAngle = 0;
  private animTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    
    const scaleX = this.width / MAP_BASE_WIDTH;
    const scaleY = (this.height - 40) / MAP_BASE_HEIGHT;
    this.baseScale = Math.min(scaleX, scaleY) * 0.96;
    
    this.baseOffsetX = (this.width - MAP_BASE_WIDTH * this.baseScale) / 2;
    this.baseOffsetY = (this.height - MAP_BASE_HEIGHT * this.baseScale) / 2 + 15;
  }

  screenToWorld(screenX: number, screenY: number): Point {
    const s = this.baseScale * this.camera.zoom;
    return {
      x: this.camera.targetX + (screenX - this.width / 2) / s,
      y: this.camera.targetY + (screenY - this.height / 2) / s,
    };
  }

  worldToScreen(worldX: number, worldY: number): Point {
    const s = this.baseScale * this.camera.zoom;
    return {
      x: this.width / 2 + (worldX - this.camera.targetX) * s,
      y: this.height / 2 + (worldY - this.camera.targetY) * s,
    };
  }

  render(
    sim: any, 
    interaction: InteractionState, 
    dt: number
  ) {
    const ctx = this.ctx;
    const { width, height } = this;
    const dayHour = sim.telemetry.dayTimeHours;
    
    // Day / Night light progression
    const dayFactor = Math.max(0, Math.min(1, Math.sin((dayHour / 24) * Math.PI)));
    
    // Background fill
    const bgCol = this.interpolateColor(THEME.night.bg, THEME.day.bg, dayFactor);
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, width, height);

    this.windTurbineAngle += (sim.weather.windSpeed * 0.12) * dt;
    this.animTime += dt;

    // Smooth camera interpolation towards level zoom target
    if (sim.targetCamera) {
      this.camera.targetX += (sim.targetCamera.targetX - this.camera.targetX) * 0.05;
      this.camera.targetY += (sim.targetCamera.targetY - this.camera.targetY) * 0.05;
      this.camera.zoom += (sim.targetCamera.zoom - this.camera.zoom) * 0.05;
    }

    // Apply camera transformation centered on target coordinates
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    const effectiveScale = this.baseScale * this.camera.zoom;
    ctx.scale(effectiveScale, effectiveScale);
    ctx.translate(-this.camera.targetX, -this.camera.targetY);

    // 1. Draw Official 41 Comarcas of Catalonia with real TopoJSON vectors
    this.drawRealComarcas(dayFactor);

    // 2. Draw Mountain Ranges & Significant Peaks
    this.drawMountains(dayFactor);

    // 3. Draw Main Rivers with Realistic Course
    this.drawRivers(dayFactor);

    // 4. Draw Power Lines (MAT and Distribution)
    this.drawPowerLines(sim.lines, sim.nodes, interaction, dayFactor, sim.packets);

    // 5. Draw Interactive Drag Ghost Line
    this.drawInteractionGhost(sim.nodes, interaction);

    // 6. Draw Energy Packets moving smoothly
    this.drawPackets(sim.packets, sim.nodes, sim.lines);

    // 7. Draw Spark Particles (Joule heating, overloads, transformers)
    this.drawSparks(sim.sparks);

    // 8. Draw Grid Nodes with Queue and Demand Indicators
    this.drawNodes(sim.nodes, sim.telemetry, sim.weather, dayFactor, interaction);

    ctx.restore();

    // 9. Notifications are rendered exclusively by React DOM (avoids canvas duplication)
  }

  // Draw official 41 comarcas of Catalonia from real GIS data
  private drawRealComarcas(dayFactor: number) {
    const ctx = this.ctx;
    const landFill = this.interpolateColor(THEME.night.landFill, THEME.day.landFill, dayFactor);
    const borderStroke = dayFactor > 0.4 ? 'rgba(180, 170, 155, 0.55)' : 'rgba(50, 65, 88, 0.45)';
    const textFill = dayFactor > 0.4 ? 'rgba(120, 110, 95, 0.4)' : 'rgba(148, 163, 184, 0.3)';

    ctx.lineWidth = 1.0;
    ctx.strokeStyle = borderStroke;
    ctx.fillStyle = landFill;

    for (const c of CATALUNYA_COMARCAS) {
      for (const poly of c.polygons) {
        if (poly.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Subtle comarca name in center
      if (c.center && c.center.x > 0 && this.camera.zoom >= 0.85) {
        ctx.font = '500 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = textFill;
        ctx.fillText(c.name, c.center.x, c.center.y);
      }
    }

    // Outer sea ambient texts
    ctx.font = '700 13px Inter, sans-serif';
    ctx.fillStyle = dayFactor > 0.4 ? 'rgba(75, 85, 99, 0.4)' : 'rgba(148, 163, 184, 0.3)';
    ctx.fillText("MAR MEDITERRÀNIA", 1120, 850);
    ctx.fillText("FRANÇA (PIRINEUS)", 720, 90);
    ctx.fillText("ARAGÓ (FRANJA)", 180, 650);
  }

  // Draw peaks and relief markers
  private drawMountains(dayFactor: number) {
    const ctx = this.ctx;
    ctx.fillStyle = dayFactor > 0.4 ? 'rgba(100, 116, 139, 0.65)' : 'rgba(148, 163, 184, 0.55)';
    ctx.font = '500 10px Inter, sans-serif';
    ctx.textAlign = 'center';

    for (const p of PYRENEES_BARRIER.peaks) {
      ctx.beginPath();
      ctx.moveTo(p.pos.x, p.pos.y - 6);
      ctx.lineTo(p.pos.x + 5, p.pos.y + 4);
      ctx.lineTo(p.pos.x - 5, p.pos.y + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillText(`▲ ${p.name} (${p.height}m)`, p.pos.x, p.pos.y - 8);
    }
  }

  // Draw rivers
  private drawRivers(dayFactor: number) {
    const ctx = this.ctx;
    const waterColor = this.interpolateColor(THEME.night.water, THEME.day.water, dayFactor);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = waterColor;

    for (const river of CATALUNYA_RIVERS) {
      ctx.lineWidth = river.width;
      ctx.beginPath();
      ctx.moveTo(river.points[0].x, river.points[0].y);
      for (let i = 1; i < river.points.length; i++) {
        ctx.lineTo(river.points[i].x, river.points[i].y);
      }
      ctx.stroke();

      const mid = river.points[Math.floor(river.points.length / 2)];
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = dayFactor > 0.4 ? 'rgba(37, 99, 235, 0.65)' : 'rgba(96, 165, 250, 0.55)';
      ctx.textAlign = 'left';
      ctx.fillText(river.name, mid.x + 8, mid.y - 4);
    }
  }

  // Draw lines
  private drawPowerLines(
    lines: PowerLine[], 
    nodes: GridNode[], 
    interaction: InteractionState, 
    dayFactor: number,
    packets?: EnergyPacket[]
  ) {
    const ctx = this.ctx;

    for (const line of lines) {
      const n1 = nodes.find(n => n.id === line.nodeIds[0]);
      const n2 = nodes.find(n => n.id === line.nodeIds[1]);
      if (!n1 || !n2) continue;

      const isMAT = line.voltage === 'MAT';
      const baseWidth = isMAT ? CONFIG.LINE_WIDTH_MAT : CONFIG.LINE_WIDTH_DIST;
      const isSelected = interaction.selectedLineId === line.id;
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (line.isTripped) {
        ctx.strokeStyle = THEME.lines.tripped;
        ctx.lineWidth = baseWidth;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(n1.pos.x, n1.pos.y);
        ctx.lineTo(n2.pos.x, n2.pos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const midX = (n1.pos.x + n2.pos.x) / 2;
        const midY = (n1.pos.y + n2.pos.y) / 2;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(midX, midY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("⚡", midX, midY);
        continue;
      }

      // Dark outer casing for high contrast at line crossings
      ctx.strokeStyle = dayFactor > 0.4 ? 'rgba(15, 23, 42, 0.35)' : 'rgba(2, 6, 23, 0.70)';
      ctx.lineWidth = baseWidth + 6.5;
      ctx.beginPath();
      ctx.moveTo(n1.pos.x, n1.pos.y);
      ctx.lineTo(n2.pos.x, n2.pos.y);
      ctx.stroke();

      ctx.strokeStyle = isMAT ? THEME.lines.matGlow : THEME.lines.distGlow;
      ctx.lineWidth = baseWidth + 4.5;
      ctx.beginPath();
      ctx.moveTo(n1.pos.x, n1.pos.y);
      ctx.lineTo(n2.pos.x, n2.pos.y);
      ctx.stroke();

      ctx.strokeStyle = line.color;
      ctx.lineWidth = isSelected ? baseWidth + 2 : baseWidth;
      ctx.beginPath();
      ctx.moveTo(n1.pos.x, n1.pos.y);
      ctx.lineTo(n2.pos.x, n2.pos.y);
      ctx.stroke();

      // Connection terminal dots at both ends (so plugged nodes are unambiguous vs crossing lines)
      const dxConn = n2.pos.x - n1.pos.x;
      const dyConn = n2.pos.y - n1.pos.y;
      const lenConn = Math.hypot(dxConn, dyConn);
      if (lenConn > 40) {
        const r1 = (n1.type === 'GENERATOR' ? CONFIG.NODE_RADIUS_LARGE : CONFIG.NODE_RADIUS_MEDIUM) + 2;
        const r2 = (n2.type === 'GENERATOR' ? CONFIG.NODE_RADIUS_LARGE : CONFIG.NODE_RADIUS_MEDIUM) + 2;
        const p1x = n1.pos.x + (dxConn / lenConn) * r1;
        const p1y = n1.pos.y + (dyConn / lenConn) * r1;
        const p2x = n2.pos.x - (dxConn / lenConn) * r2;
        const p2y = n2.pos.y - (dyConn / lenConn) * r2;
        ctx.fillStyle = line.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p1x, p1y, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p2x, p2y, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Hovered line highlight & scissors delete indicator
      if (interaction.hoverLineId === line.id) {
        ctx.strokeStyle = '#F43F5E';
        ctx.lineWidth = baseWidth + 3.5;
        ctx.beginPath();
        ctx.moveTo(n1.pos.x, n1.pos.y);
        ctx.lineTo(n2.pos.x, n2.pos.y);
        ctx.stroke();

        const midX = (n1.pos.x + n2.pos.x) / 2;
        const midY = (n1.pos.y + n2.pos.y) / 2;
        ctx.fillStyle = '#E11D48';
        ctx.beginPath();
        ctx.arc(midX, midY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✂️', midX, midY);
      }

      if (line.isReinforced) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Animated directional power flow chevrons along active lines
      const dx = n2.pos.x - n1.pos.x;
      const dy = n2.pos.y - n1.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 35) {
        // Determine flow direction (Generator -> Substation -> Consumer, or Bidirectional Ring)
        let dirFrom = n1.pos;
        let dirTo = n2.pos;
        const isSubToSub = n1.type === 'SUBSTATION' && n2.type === 'SUBSTATION';
        const isConsToCons = n1.type === 'CONSUMER' && n2.type === 'CONSUMER';
        const isBidirectional = isSubToSub || isConsToCons;
        const linePackets = packets ? packets.filter(p => p.lineId === line.id) : [];

        if (isBidirectional) {
          if (linePackets.length > 0) {
            const lastPkt = linePackets[linePackets.length - 1];
            if (lastPkt.fromNodeId === n2.id) {
              dirFrom = n2.pos;
              dirTo = n1.pos;
            } else {
              dirFrom = n1.pos;
              dirTo = n2.pos;
            }
          }
        } else {
          if (n2.type === 'GENERATOR' || (n2.type === 'SUBSTATION' && n1.type === 'CONSUMER')) {
            dirFrom = n2.pos;
            dirTo = n1.pos;
          }
        }

        const fdx = dirTo.x - dirFrom.x;
        const fdy = dirTo.y - dirFrom.y;
        const angle = Math.atan2(fdy, fdx);
        const step = 42;
        const count = Math.max(1, Math.floor(len / step));
        const flowOffset = (this.animTime * (isMAT ? 0.85 : 0.6)) % 1;

        ctx.save();
        ctx.strokeStyle = isMAT ? 'rgba(255, 237, 213, 0.75)' : 'rgba(224, 242, 254, 0.75)';
        ctx.lineWidth = 1.4;
        for (let i = 0; i < count; i++) {
          const t = ((i + flowOffset) / count) % 1;
          if (t < 0.12 || t > 0.88) continue;
          const cx = dirFrom.x + fdx * t;
          const cy = dirFrom.y + fdy * t;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          if (isBidirectional && linePackets.length === 0) {
            // Dual diamond pulse indicating bidirectional synchronous standby
            ctx.beginPath();
            ctx.moveTo(-2.5, -2);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2.5, 2);
            ctx.moveTo(2.5, -2);
            ctx.lineTo(0, 0);
            ctx.lineTo(2.5, 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(-3, -2.5);
            ctx.lineTo(1.5, 0);
            ctx.lineTo(-3, 2.5);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }
    }
  }

  private drawInteractionGhost(nodes: GridNode[], interaction: InteractionState) {
    if (!interaction.isDragging || !interaction.dragStartNodeId || !interaction.dragCurrentWorldPos) {
      return;
    }

    const startNode = nodes.find(n => n.id === interaction.dragStartNodeId);
    if (!startNode) return;

    // Use strictly the manually selected voltage
    const isMAT = interaction.selectedVoltage === 'MAT';
    const ctx = this.ctx;
    const ghostColor = isMAT ? '#EA580C' : '#0284C7';
    const lineWidth = isMAT ? CONFIG.LINE_WIDTH_MAT : CONFIG.LINE_WIDTH_DIST;

    const dx = interaction.dragCurrentWorldPos.x - startNode.pos.x;
    const dy = interaction.dragCurrentWorldPos.y - startNode.pos.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    const lengthKm = Math.max(3, Math.round(pixelDist * CONFIG.KM_PER_COORD_UNIT));
    const lossPct = isMAT ? (lengthKm * 0.015).toFixed(1) : (lengthKm * 0.08).toFixed(1);

    ctx.save();
    ctx.strokeStyle = ghostColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([10, 8]);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startNode.pos.x, startNode.pos.y);
    ctx.lineTo(interaction.dragCurrentWorldPos.x, interaction.dragCurrentWorldPos.y);
    ctx.stroke();
    ctx.restore();
  }

  private drawPackets(packets: EnergyPacket[], nodes: GridNode[], lines: PowerLine[]) {
    const ctx = this.ctx;

    const sourceColors: Record<string, { core: string; glow: string; border: string }> = {
      NUCLEAR: { core: '#F3E8FF', glow: 'rgba(168, 85, 247, 0.45)', border: '#9333EA' },
      SOLAR: { core: '#FEF9C3', glow: 'rgba(234, 179, 8, 0.5)', border: '#CA8A04' },
      WIND: { core: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.45)', border: '#0284C7' },
      HYDRO_PUMP: { core: '#CFFAFE', glow: 'rgba(6, 182, 212, 0.5)', border: '#0891B2' },
      GAS_COMBINED: { core: '#FFEDD5', glow: 'rgba(249, 115, 22, 0.5)', border: '#EA580C' },
      BIOMASS: { core: '#DCFCE7', glow: 'rgba(34, 197, 94, 0.5)', border: '#16A34A' },
    };

    for (const pkt of packets) {
      const fromNode = nodes.find(n => n.id === pkt.fromNodeId);
      const toNode = nodes.find(n => n.id === pkt.toNodeId);
      if (!fromNode || !toNode) continue;

      const isMAT = pkt.voltage === 'MAT';
      const radius = isMAT ? CONFIG.PACKET_RADIUS + 1 : CONFIG.PACKET_RADIUS;
      const palette = sourceColors[pkt.sourceType] || (isMAT 
        ? { core: '#FFF7ED', glow: 'rgba(251, 146, 60, 0.45)', border: '#EA580C' }
        : { core: '#F0F9FF', glow: 'rgba(56, 189, 248, 0.45)', border: '#0284C7' });

      // 4-step glowing comet trail behind the energy packet
      for (let step = 4; step >= 1; step--) {
        const trailT = Math.max(0, pkt.t - step * 0.025);
        const trailPos = lerp(fromNode.pos, toNode.pos, trailT);
        const trailRadius = radius * (1 - step * 0.16);
        ctx.save();
        ctx.globalAlpha = Math.max(0.08, 0.48 - step * 0.1);
        ctx.beginPath();
        ctx.arc(trailPos.x, trailPos.y, trailRadius + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = palette.border;
        ctx.fill();
        ctx.restore();
      }

      const pos = lerp(fromNode.pos, toNode.pos, pkt.t);

      // Outer energetic halo
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 3.5, 0, Math.PI * 2);
      ctx.fillStyle = palette.glow;
      ctx.fill();

      // Core energy sphere
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = palette.core;
      ctx.fill();
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  private drawSparks(sparks: SparkParticle[]) {
    const ctx = this.ctx;
    for (const s of sparks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw Grid Nodes
  private drawNodes(
    nodes: GridNode[], 
    telemetry: any, 
    weather: any, 
    dayFactor: number, 
    interaction: InteractionState
  ) {
    const ctx = this.ctx;

    for (const node of nodes) {
      const { x, y } = node.pos;
      const isHovered = interaction.hoverNodeId === node.id;
      const r = node.type === 'GENERATOR' ? CONFIG.NODE_RADIUS_LARGE : CONFIG.NODE_RADIUS_MEDIUM;

      // 0. Nighttime "Living City" light clusters & brownout flicker
      if (node.type === 'CONSUMER' && dayFactor < 0.6) {
        this.drawNightCityGlow(ctx, node, x, y, r, dayFactor);
      }

      // 1. Critical Alarm / Blackout timer circle
      if (node.isCriticalAlarm && node.overloadTimer < node.maxOverloadTime) {
        const progress = 1 - (node.overloadTimer / node.maxOverloadTime);
        ctx.beginPath();
        ctx.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 4.5;
        ctx.stroke();
      }

      // 2. Hover ring
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = dayFactor > 0.4 ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 3. Node Base Shape
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1F2937';

      switch (node.type) {
        case 'GENERATOR':
          this.drawGeneratorNode(node, x, y, r, weather);
          break;
        case 'SUBSTATION':
          this.drawSubstationNode(node, x, y, r);
          break;
        case 'CONSUMER':
          this.drawConsumerNode(node, x, y, r);
          break;
      }

      // 4. Energy queues
      if (node.type === 'GENERATOR' && (node.generationQueue || 0) > 0) {
        this.drawGeneratorQueue(node, x, y, r);
      }
      if (node.type === 'SUBSTATION' && (node.generationQueue || 0) > 0) {
        this.drawSubstationQueue(node, x, y, r);
      }
      if (node.type === 'CONSUMER' && node.demandSlots > 0) {
        this.drawDemandSlots(node, x, y, r);
      }

      // 5. Battery & Installed Upgrade Badges
      if (node.hasBattery) {
        this.drawBatteryBadge(node, x + r + 4, y - r);
      }
      this.drawNodeUpgradeBadges(node, x, y, r);
    }
  }

  private drawNodeUpgradeBadges(node: GridNode, x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.save();

    // A. Generator Badges (AGC & Tech Upgrade)
    if (node.type === 'GENERATOR') {
      if (node.hasAutoFrequencyRegulation) {
        const bx = x - r - 6;
        const by = y + r - 3;
        ctx.fillStyle = '#0891B2';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx - 12, by - 4.5, 24, 9, 3.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 6.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AGC', bx, by);
      }

      const hasTechUpgrade = Boolean(
        node.hasSolarTrackers ||
        node.hasLowWindBlades ||
        node.hasHydroPeltonUpgrade ||
        node.hasGasHydrogenMix ||
        node.hasGreenHydrogen100 ||
        node.hasNuclearUprate ||
        node.hasBiomassGasifier
      );

      if (hasTechUpgrade) {
        const ux = x - r - 4;
        const uy = y - r + 3;
        ctx.fillStyle = node.hasGreenHydrogen100 ? '#10B981' : '#F59E0B';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(ux, uy, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.hasGreenHydrogen100 ? 'H₂' : '★', ux, uy + 0.5);
      }
    }

    // B. Consumer Badges (Efficiency count, Interruptibility, Hospital SAI)
    if (node.type === 'CONSUMER') {
      if (node.isInterrupted) {
        ctx.fillStyle = '#E11D48';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - 16, y - r - 11, 32, 9, 3.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 6.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛑 TALL', x, y - r - 6.5);
      }

      let upgCount = 0;
      if (node.hasRooftopSolar) upgCount++;
      if (node.hasThermalInsulation) upgCount++;
      if (node.hasSmartMetering) upgCount++;
      if (node.hasV2G) upgCount++;
      if (node.hasSmartLED) upgCount++;
      if (node.hasEcoFilters) upgCount++;
      if (node.hasHeatRecovery) upgCount++;
      if (node.hasPortElectrification) upgCount++;
      if (node.hasHospitalMicrogrid) upgCount++;

      if (upgCount > 0) {
        const bx = x - r - 5;
        const by = y - r + 4;
        ctx.fillStyle = node.hasHospitalMicrogrid ? '#E11D48' : '#059669';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(bx, by, 6.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(upgCount > 1 ? `+${upgCount}` : '★', bx, by + 0.5);
      }
    }

    ctx.restore();
  }

  private drawGeneratorQueue(node: GridNode, x: number, y: number, r: number) {
    const ctx = this.ctx;
    const qCount = node.generationQueue || 0;
    const packetR = 3.5;
    const startX = x - ((qCount - 1) * 9) / 2;
    const posY = y - r - 8;

    for (let i = 0; i < qCount; i++) {
      const px = startX + i * 9;
      ctx.beginPath();
      ctx.arc(px, posY, packetR, 0, Math.PI * 2);
      ctx.fillStyle = '#FBBF24';
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawSubstationQueue(node: GridNode, x: number, y: number, r: number) {
    const ctx = this.ctx;
    const qCount = node.generationQueue || 0;
    const packetR = 3.5;
    const startX = x - ((qCount - 1) * 9) / 2;
    const posY = y - r - 8;

    const sourceFill: Record<string, { fill: string; stroke: string }> = {
      NUCLEAR: { fill: '#D8B4FE', stroke: '#9333EA' },
      SOLAR: { fill: '#FDE047', stroke: '#CA8A04' },
      WIND: { fill: '#7DD3FC', stroke: '#0284C7' },
      HYDRO_PUMP: { fill: '#67E8F9', stroke: '#0891B2' },
      GAS_COMBINED: { fill: '#FDBA74', stroke: '#EA580C' },
      BIOMASS: { fill: '#86EFAC', stroke: '#16A34A' },
    };

    for (let i = 0; i < qCount; i++) {
      const px = startX + i * 9;
      const src = node.substationPacketSources?.[i];
      const colors = (src && sourceFill[src]) || { fill: '#38BDF8', stroke: '#0284C7' };
      ctx.beginPath();
      ctx.arc(px, posY, packetR, 0, Math.PI * 2);
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawGeneratorNode(node: GridNode, x: number, y: number, r: number, weather: any) {
    const ctx = this.ctx;
    switch (node.generatorType) {
      case 'NUCLEAR':
        this.drawNuclearNode(ctx, node, x, y, r);
        break;
      case 'SOLAR':
        this.drawSolarNode(ctx, x, y, r, weather);
        break;
      case 'WIND':
        this.drawWindNode(ctx, node, x, y, r);
        break;
      case 'HYDRO_PUMP':
        this.drawHydroNode(ctx, node, x, y, r);
        break;
      case 'GAS_COMBINED':
        this.drawGasNode(ctx, node, x, y, r);
        break;
      case 'BIOMASS':
        this.drawBiomassNode(ctx, node, x, y, r);
        break;
    }
  }

  private drawNightCityGlow(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number, dayFactor: number) {
    const nightIntensity = Math.min(1, (0.6 - dayFactor) / 0.45);
    const isBrownout = node.demandSlots >= 4;
    const isCritical = node.demandSlots >= 6;
    const flicker = isBrownout 
      ? (Math.sin(this.animTime * (isCritical ? 24 : 12) + x) > 0 ? 0.25 : 0.85)
      : 1.0;

    ctx.save();
    // Warm golden ambient city halo (or red warning aura if brownout)
    const grad = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.8);
    if (isCritical) {
      grad.addColorStop(0, `rgba(239, 68, 68, ${0.42 * nightIntensity * flicker})`);
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
      grad.addColorStop(0, `rgba(251, 191, 36, ${0.38 * nightIntensity * flicker})`);
      grad.addColorStop(0.6, `rgba(245, 158, 11, ${0.16 * nightIntensity * flicker})`);
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Constellation of surrounding urban streetlamp dots
    const seed = Math.round(x + y);
    const dotCount = node.id === 'cons-barcelona' ? 14 : 9;
    for (let i = 0; i < dotCount; i++) {
      const angle = ((i / dotCount) * Math.PI * 2) + (seed % 5) * 0.3;
      const distR = r + 5 + ((i * 7 + seed) % 13);
      const lx = x + Math.cos(angle) * distR;
      const ly = y + Math.sin(angle) * distR;
      const dotFlicker = isBrownout && ((i + Math.floor(this.animTime * 8)) % 3 === 0) ? 0.15 : 0.9;
      ctx.fillStyle = isCritical && i % 2 === 0
        ? `rgba(248, 113, 113, ${nightIntensity * dotFlicker})`
        : `rgba(253, 224, 71, ${nightIntensity * dotFlicker})`;
      ctx.beginPath();
      ctx.arc(lx, ly, (i % 3 === 0 ? 1.8 : 1.2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 1. Realistic Nuclear Plant (Ascó, Vandellòs)
  private drawNuclearNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    ctx.save();
    // Hexagonal purple capsule base
    ctx.fillStyle = '#6D28D9';
    ctx.strokeStyle = '#311042';
    ctx.lineWidth = 2.5;
    this.drawRegularPolygon(ctx, x, y, r, 6);
    ctx.fill();
    ctx.stroke();

    // Subtle inner bevel ring
    ctx.beginPath();
    this.drawRegularPolygon(ctx, x, y, r - 2.5, 6);
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hyperbolic cooling tower silhouette (concrete grey)
    ctx.beginPath();
    ctx.moveTo(x - 6.5, y + 8);
    ctx.lineTo(x + 6.5, y + 8); // base
    ctx.quadraticCurveTo(x + 2.8, y + 1, x + 4.2, y - 5); // right waist to flared lip
    ctx.lineTo(x - 4.2, y - 5); // top opening
    ctx.quadraticCurveTo(x - 2.8, y + 1, x - 6.5, y + 8); // left lip through waist to base
    ctx.closePath();
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Animated Cooling Steam Plume rising from chimney lip
    const throttle = node.throttle ?? 1.0;
    if (throttle > 0.05) {
      for (let i = 0; i < 3; i++) {
        const phase = (this.animTime * 0.9 + i * 0.33) % 1;
        const sy = y - 6 - phase * 11;
        const sx = x + Math.sin(this.animTime * 2 + i * 2) * 2.2;
        const sr = (1.8 + phase * 3.0) * throttle;
        const alpha = Math.max(0, (1 - phase) * 0.85 * throttle);
        ctx.fillStyle = `rgba(248, 250, 252, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Superimposed Atomic Orbital Symbol
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(x, y + 2, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 7.5, 3.2, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(x, y + 2, 7.5, 3.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Realistic Photovoltaic Solar Array (Ponent, Garrigues, Baix Llobregat)
  private drawSolarNode(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, weather: any) {
    ctx.save();
    // Sun rays radiating if daytime
    if (weather.solarIntensity > 0.1) {
      const rayLen = 5 + weather.solarIntensity * 3.5;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * (r + 1), y + Math.sin(angle) * (r + 1));
        ctx.lineTo(x + Math.cos(angle) * (r + rayLen), y + Math.sin(angle) * (r + rayLen));
        ctx.stroke();
      }
    }

    // Circular dark blue silicon base
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Photovoltaic panel array in 3D perspective (silicon matrix)
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 6);
    ctx.lineTo(x + 9, y + 6);
    ctx.lineTo(x + 7, y - 6);
    ctx.lineTo(x - 7, y - 6);
    ctx.closePath();
    ctx.fillStyle = '#1D4ED8';
    ctx.fill();
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Silicon busbars (cell divisions)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x - 3, y + 6);
    ctx.lineTo(x - 2.2, y - 6);
    ctx.moveTo(x + 3, y + 6);
    ctx.lineTo(x + 2.2, y - 6);
    ctx.stroke();

    // Glass sheen reflection highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 5);
    ctx.lineTo(x + 3, y - 5);
    ctx.lineTo(x - 2, y + 4);
    ctx.lineTo(x - 7, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Realistic Wind Turbine (Terra Alta, Empordà, Tallat)
  private drawWindNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    ctx.save();
    // Aerodynamic rounded triangle shield
    ctx.fillStyle = '#0284C7';
    ctx.strokeStyle = '#0C4A6E';
    ctx.lineWidth = 2.5;
    this.drawRegularPolygon(ctx, x, y, r, 3, -Math.PI / 2);
    ctx.fill();
    ctx.stroke();

    // Turbine pylon tower (slender tapered white)
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 9);
    ctx.lineTo(x + 2, y + 9);
    ctx.lineTo(x + 1, y - 1);
    ctx.lineTo(x - 1, y - 1);
    ctx.closePath();
    ctx.fill();

    const hubX = x;
    const hubY = y - 1;
    const throttle = node.throttle ?? 1.0;

    // 3 Aerodynamic tapered rotor blades spinning with actual wind speed * throttle
    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(this.windTurbineAngle * throttle);

    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 3);

      // Blade airfoil shape
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.quadraticCurveTo(-1.8, -5.5, 0, -11.5);
      ctx.quadraticCurveTo(1.2, -5.5, 1, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red tip marker (safety aviation paint)
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(-0.7, -9.5);
      ctx.lineTo(0, -11.5);
      ctx.lineTo(0.7, -9.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    // Central rotor hub cap
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hubX, hubY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 4. Realistic Hydroelectric Reversible Dam (Susqueda, Pallars / Sallente)
  private drawHydroNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    ctx.save();
    // Diamond shield in deep mountain turquoise
    ctx.fillStyle = '#0891B2';
    ctx.strokeStyle = '#155E75';
    ctx.lineWidth = 2.5;
    this.drawRegularPolygon(ctx, x, y, r, 4, 0);
    ctx.fill();
    ctx.stroke();

    // Curved concrete dam wall (presa d'embassament)
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(x, y + 2, 7.5, Math.PI, 0, false);
    ctx.lineTo(x + 5.5, y + 6);
    ctx.arc(x, y + 4, 5.5, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Water ripple reservoir waves
    ctx.strokeStyle = '#67E8F9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y - 3, 4.5, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 1, 3.5, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    // Water reservoir level storage bar
    const storage = Math.max(0, Math.min(1, (node.hydroStorage || 0) / 100));
    const barW = 14;
    const barH = 3;
    const barX = x - barW / 2;
    const barY = y + 7.5;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = node.hydroMode === 'TURBO' ? '#F59E0B' : '#22D3EE';
    ctx.fillRect(barX, barY, barW * storage, barH);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(barX, barY, barW, barH);

    // Mode badge (PUMPING / TURBO)
    if (node.hydroMode && node.hydroMode !== 'AUTO') {
      ctx.fillStyle = node.hydroMode === 'PUMPING' ? '#0284C7' : node.hydroMode === 'TURBO' ? '#DC2626' : '#059669';
      ctx.beginPath();
      ctx.roundRect(x - 11, y - r - 6, 22, 8, 3);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 6.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = node.hydroMode === 'PUMPING' ? '⬆️BOMB' : node.hydroMode === 'TURBO' ? '🚀140%' : '⚡TURB';
      ctx.fillText(label, x, y - r - 2);
    }

    ctx.restore();
  }

  // 5. Realistic Combined Cycle Gas Plant (Besòs, Port de Tarragona)
  private drawGasNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    ctx.save();
    const throttlePct = Math.round((node.gasThrottle !== undefined ? node.gasThrottle : (node.isGasActive ? 0.65 : 0)) * 100);
    const isGasOn = throttlePct > 0;

    // Industrial rounded chassis in dark slate
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = isGasOn ? '#EA580C' : '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - r, y - r, r * 2, r * 2, 5);
    ctx.fill();
    ctx.stroke();

    // Twin industrial exhaust stacks on top
    ctx.fillStyle = '#64748B';
    ctx.fillRect(x - 6, y - 9, 3.5, 6);
    ctx.fillRect(x + 2.5, y - 9, 3.5, 6);

    // Active combustion effects
    if (isGasOn) {
      // Heat/smoke plume rising (plume size and opacity proportional to throttle)
      const plumeAlpha = 0.35 + (throttlePct / 100) * 0.45;
      ctx.fillStyle = `rgba(249, 115, 22, ${plumeAlpha})`;
      const plumeR = 2.0 + (throttlePct / 100) * 2.5;
      ctx.beginPath();
      ctx.arc(x - 4.2, y - 11 - (throttlePct * 0.04), plumeR, 0, Math.PI * 2);
      ctx.arc(x + 4.2, y - 11 - (throttlePct * 0.04), plumeR, 0, Math.PI * 2);
      ctx.fill();

      // Dual-color combustion flame (electric blue core + fiery orange outer flame)
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 1.5);
      ctx.quadraticCurveTo(x - 5, y - 3, x, y - 6.5);
      ctx.quadraticCurveTo(x + 5, y - 3, x + 4, y + 1.5);
      ctx.quadraticCurveTo(x, y + 3.5, x - 4, y + 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 1);
      ctx.quadraticCurveTo(x - 2.5, y - 2, x, y - 4.2);
      ctx.quadraticCurveTo(x + 2.5, y - 2, x + 2, y + 1);
      ctx.quadraticCurveTo(x, y + 2.5, x - 2, y + 1);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(x, y - 1.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Power Throttle % pill badge
    const switchW = 22;
    const switchH = 9;
    const switchX = x - switchW / 2;
    const switchY = y + 4.5;
    ctx.beginPath();
    ctx.roundRect(switchX, switchY, switchW, switchH, 4);
    ctx.fillStyle = isGasOn ? '#C2410C' : '#334155';
    ctx.fill();
    ctx.strokeStyle = isGasOn ? '#FB923C' : '#64748B';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isGasOn ? `${throttlePct}%` : '0%', x, switchY + switchH / 2);

    ctx.restore();
  }

  // 5b. Realistic Biomass & Biogas Plant (Osona-Montseny, Garrotxa)
  private drawBiomassNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    ctx.save();
    const throttlePct = Math.round((node.throttle ?? 1.0) * 100);
    const isActive = throttlePct > 0;

    // Eco-chassis: forest green octagon
    ctx.fillStyle = '#14532D';
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 2.5;
    this.drawRegularPolygon(ctx, x, y, r, 8);
    ctx.fill();
    ctx.stroke();

    // Inner bevel ring
    ctx.beginPath();
    this.drawRegularPolygon(ctx, x, y, r - 2.5, 8);
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bio-digester dome & silhouetted leaf
    ctx.beginPath();
    ctx.arc(x, y - 1, 6.5, Math.PI, 0); // hemispherical dome
    ctx.lineTo(x + 6.5, y + 4);
    ctx.lineTo(x - 6.5, y + 4);
    ctx.closePath();
    ctx.fillStyle = isActive ? '#15803D' : '#334155';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#22C55E' : '#64748B';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Leaf sprout inside dome
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.quadraticCurveTo(x + 3.5, y - 2, x, y - 5.5);
    ctx.quadraticCurveTo(x - 3.5, y - 2, x, y + 2);
    ctx.fillStyle = isActive ? '#86EFAC' : '#94A3B8';
    ctx.fill();

    // Power Throttle % pill badge
    const switchW = 22;
    const switchH = 9;
    const switchX = x - switchW / 2;
    const switchY = y + 4.5;
    ctx.beginPath();
    ctx.roundRect(switchX, switchY, switchW, switchH, 4);
    ctx.fillStyle = isActive ? '#15803D' : '#334155';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#4ADE80' : '#64748B';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${throttlePct}%`, x, switchY + switchH / 2);

    ctx.restore();
  }

  // 6. Realistic Substation (Can Jardí, Begues, Sentmenat, Mangraners, Vandellòs Hub, Vic, Bescanó)
  private drawSubstationNode(node: GridNode, x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.save();
    // Heavy duty electrical substation transformer housing
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - r, y - r + 3, r * 2, r * 2 - 3, 4);
    ctx.fill();
    ctx.stroke();

    // Radiator cooling fins on left and right sides
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i += 3) {
      ctx.beginPath();
      ctx.moveTo(x - r, y + i + 1);
      ctx.lineTo(x - r - 2.5, y + i + 1);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + r, y + i + 1);
      ctx.lineTo(x + r + 2.5, y + i + 1);
      ctx.stroke();
    }

    // High Voltage ceramic insulator bushings on top
    // Left bushing: MAT 400 kV (Orange)
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(x - 6.5, y - r - 2, 3.5, 5);
    ctx.fillStyle = '#FB923C';
    ctx.fillRect(x - 7.5, y - r + 0.5, 5.5, 1.2);
    // Right bushing: Distribució 25 kV (Blue)
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(x + 3, y - r - 2, 3.5, 5);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(x + 2, y - r + 0.5, 5.5, 1.2);

    // Center Step-down Transformer coils (two overlapping rings)
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x - 3.2, y + 2, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(x + 3.2, y + 2, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    // High voltage transformation spark chevron
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x - 1.8, y + 2);
    ctx.lineTo(x + 0.5, y + 2);
    ctx.lineTo(x - 0.5, y + 6);
    ctx.lineTo(x + 2, y + 1);
    ctx.lineTo(x - 0.2, y + 1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 7. Realistic Consumer Nodes (Differentiated by site & type)
  private drawConsumerNode(node: GridNode, x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.save();
    switch (node.consumerType) {
      case 'RESIDENTIAL':
        this.drawResidentialNode(ctx, node, x, y, r);
        break;
      case 'INDUSTRIAL':
        this.drawIndustrialNode(ctx, node, x, y, r);
        break;
      case 'CRITICAL':
        this.drawCriticalNode(ctx, node, x, y, r);
        break;
    }
    ctx.restore();
  }

  // A. Residential Cities (Barcelona, Sabadell, Girona, Lleida, Tarragona, Reus...)
  private drawResidentialNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    // Emerald green circular base
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // City skyline silhouette with lit windows
    ctx.fillStyle = '#064E3B';
    // Back buildings
    ctx.fillRect(x - 7.5, y - 2, 4, 9);
    ctx.fillRect(x + 3.5, y - 4, 4, 11);
    // Spire/tower
    ctx.beginPath();
    ctx.moveTo(x - 1.5, y - 7);
    ctx.lineTo(x, y - 9.5);
    ctx.lineTo(x + 1.5, y - 7);
    ctx.lineTo(x + 1.5, y + 7);
    ctx.lineTo(x - 1.5, y + 7);
    ctx.closePath();
    ctx.fill();

    // Foreground buildings (white/light grey)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 9, y + 1, 4.5, 6);
    ctx.fillRect(x - 3.5, y - 3, 7, 10);
    ctx.fillRect(x + 4.5, y - 1, 4.5, 8);

    // Warm glowing illuminated windows
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(x - 2, y - 1, 1.3, 1.3);
    ctx.fillRect(x + 0.7, y - 1, 1.3, 1.3);
    ctx.fillRect(x - 2, y + 2, 1.3, 1.3);
    ctx.fillRect(x + 0.7, y + 2, 1.3, 1.3);
    ctx.fillRect(x - 7.5, y + 3, 1.3, 1.3);
    ctx.fillRect(x + 6, y + 1.5, 1.3, 1.3);
  }

  // B. Industrial Centers (Differentiated: Petroquímic, Zona Franca, SEAT Martorell)
  private drawIndustrialNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    // Heavy industrial indigo/slate chassis
    ctx.fillStyle = '#4338CA';
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(x - r, y - r * 0.85, r * 2, r * 1.7);
    ctx.fill();
    ctx.stroke();

    if (node.id === 'cons-petroquimic') {
      // Petrochemical Refinery: Distillation cracking tower + Spherical LNG gas tank
      // Distillation column
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(x - 7.5, y - 7, 4.5, 13);
      // Horizontal column stage rings
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 7.5, y - 4);
      ctx.lineTo(x - 3, y - 4);
      ctx.moveTo(x - 7.5, y - 1);
      ctx.lineTo(x - 3, y - 1);
      ctx.moveTo(x - 7.5, y + 2);
      ctx.lineTo(x - 3, y + 2);
      ctx.stroke();

      // Spherical pressurized tank
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(x + 3.5, y - 0.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Tank support legs
      ctx.strokeStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y + 3.5);
      ctx.lineTo(x - 0.5, y + 6);
      ctx.moveTo(x + 6.5, y + 3.5);
      ctx.lineTo(x + 7.5, y + 6);
      ctx.stroke();
    } else if (node.id === 'cons-zona-franca') {
      // Zona Franca & Port: Logistics Hub with Warehouses & Intermodal Containers
      // 1. Logistics warehouse with loading bay
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 6);
      ctx.lineTo(x - 8, y - 2);
      ctx.lineTo(x - 2, y - 6.5);
      ctx.lineTo(x + 4, y - 2);
      ctx.lineTo(x + 4, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Warehouse loading dock door
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 6.5, y + 1.5, 4.5, 4.5);

      // 2. Stacked Cargo Containers (Maritime Orange + Ocean Blue)
      // Bottom Container (Orange)
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(x - 0.5, y + 1.5, 8.5, 4.5);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(x - 0.5, y + 1.5, 8.5, 4.5);
      // Container rib lines
      ctx.beginPath();
      ctx.moveTo(x + 2.2, y + 1.5);
      ctx.lineTo(x + 2.2, y + 6);
      ctx.moveTo(x + 5.2, y + 1.5);
      ctx.lineTo(x + 5.2, y + 6);
      ctx.stroke();

      // Top Container (Blue)
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(x + 1, y - 3.5, 7.5, 4.5);
      ctx.strokeRect(x + 1, y - 3.5, 7.5, 4.5);
      ctx.beginPath();
      ctx.moveTo(x + 3.5, y - 3.5);
      ctx.lineTo(x + 3.5, y + 1);
      ctx.moveTo(x + 6, y - 3.5);
      ctx.lineTo(x + 6, y + 1);
      ctx.stroke();
    } else {
      // Factory (e.g. SEAT Martorell): Saw-tooth roof ("dents de serra") & gear
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 5);
      ctx.lineTo(x - 8, y - 2);
      ctx.lineTo(x - 4, y - 6);
      ctx.lineTo(x - 4, y - 2);
      ctx.lineTo(x, y - 6);
      ctx.lineTo(x, y - 2);
      ctx.lineTo(x + 4, y - 6);
      ctx.lineTo(x + 4, y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Mechanical Gear in corner
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(x + 3.5, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4338CA';
      ctx.beginPath();
      ctx.arc(x + 3.5, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // C. Critical Infrastructure (Hospital Vall d'Hebron vs Aeroport El Prat)
  private drawCriticalNode(ctx: CanvasRenderingContext2D, node: GridNode, x: number, y: number, r: number) {
    if (node.id === 'cons-aeroport-elprat') {
      // Aeronautical deep navy base
      ctx.fillStyle = '#1E3A8A';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Airport runway dashed line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2.5, 2.5]);
      ctx.beginPath();
      ctx.moveTo(x, y + 9);
      ctx.lineTo(x, y - 9);
      ctx.stroke();
      ctx.setLineDash([]);

      // Modern passenger aircraft silhouette
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      // Fuselage & nose
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 1.6, y - 4);
      // Right wing
      ctx.lineTo(x + 8, y + 1);
      ctx.lineTo(x + 7.5, y + 2.5);
      ctx.lineTo(x + 1.6, y + 1);
      // Right tail
      ctx.lineTo(x + 1.6, y + 6);
      ctx.lineTo(x + 4, y + 7.5);
      ctx.lineTo(x + 4, y + 8.5);
      ctx.lineTo(x, y + 7.5);
      // Left tail
      ctx.lineTo(x - 4, y + 8.5);
      ctx.lineTo(x - 4, y + 7.5);
      ctx.lineTo(x - 1.6, y + 6);
      // Left wing
      ctx.lineTo(x - 1.6, y + 1);
      ctx.lineTo(x - 7.5, y + 2.5);
      ctx.lineTo(x - 8, y + 1);
      ctx.lineTo(x - 1.6, y - 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Hospital (Vall d'Hebron): Pristine white base with red emergency cross & ECG pulse
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bold Red Medical Cross
      ctx.fillStyle = '#DC2626';
      const cW = 4.2;
      const cH = 13;
      ctx.fillRect(x - cW / 2, y - cH / 2, cW, cH);
      ctx.fillRect(x - cH / 2, y - cW / 2, cH, cW);

      // Vital Signs Heartbeat ECG Pulse Line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x - 2.5, y);
      ctx.lineTo(x - 1.2, y - 3.2);
      ctx.lineTo(x + 0.2, y + 3.2);
      ctx.lineTo(x + 1.5, y - 1.5);
      ctx.lineTo(x + 2.5, y);
      ctx.lineTo(x + 6, y);
      ctx.stroke();
    }
  }

  private drawDemandSlots(node: GridNode, x: number, y: number, r: number) {
    const ctx = this.ctx;
    const slotSize = 6;
    const spacing = 8.5;
    const startX = x + r + 6;
    const startY = y - (node.demandSlots * spacing) / 2;

    for (let i = 0; i < node.demandSlots; i++) {
      const sy = startY + i * spacing;
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(startX, sy, slotSize, slotSize);
      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, sy, slotSize, slotSize);
    }
  }

  private drawBatteryBadge(node: GridNode, x: number, y: number) {
    const ctx = this.ctx;
    const bCount = node.batteryCount || (node.hasBattery ? 1 : 0);
    const charge = Math.max(0, Math.min(1, (node.batteryStorage || 0) / 100));

    // Outer battery chassis
    const w = 12;
    const h = 17;
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, w, h);

    // Battery terminal nipple
    ctx.fillStyle = '#34D399';
    ctx.fillRect(x + 3.5, y - 2.5, 5, 2.5);

    // Internal charge fluid
    const fillH = Math.round(13 * charge);
    ctx.fillStyle = node.batteryMode === 'CHARGING' ? '#22C55E' : node.batteryMode === 'DISCHARGING' ? '#38BDF8' : '#10B981';
    ctx.fillRect(x + 1.5, y + h - 2 - fillH, w - 3, fillH);

    // Count indicator badge if multiple batteries installed
    if (bCount > 1) {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(x + w + 5, y + 4, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${bCount}`, x + w + 5, y + 4);
    }
  }

  private drawSmartMeterBadge(node: GridNode, x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(x, y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("⚡", x, y + 8);
  }

  // Draw Screen-Space Toast Banner for Educational Feedback
  private drawNotificationToast(notification: { text: string; isError: boolean; timer: number }) {
    const ctx = this.ctx;
    const paddingX = 20;
    const paddingY = 12;
    const maxWidth = Math.min(680, this.width - 40);
    
    ctx.font = '600 13px Inter, sans-serif';
    
    // Simple line wrap
    const words = notification.text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      if (ctx.measureText(testLine).width < maxWidth - paddingX * 2) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    const boxHeight = lines.length * 20 + paddingY * 2;
    const boxWidth = maxWidth;
    const boxX = (this.width - boxWidth) / 2;
    const boxY = this.height - 110 - boxHeight;

    // Toast box with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = notification.isError ? '#7F1D1D' : '#14532D';
    ctx.strokeStyle = notification.isError ? '#F87171' : '#4ADE80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Text lines
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], this.width / 2, boxY + paddingY + i * 20);
    }
  }

  private drawRegularPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number, startAngle: number = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + (i / sides) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  private interpolateColor(hex1: string, hex2: string, factor: number): string {
    const c1 = this.hexToRgb(hex1);
    const c2 = this.hexToRgb(hex2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string) {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }
}
