import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Barcode,
  Boxes,
  CalendarClock,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cloud,
  CloudOff,
  Layers3,
  PackageCheck,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Tag,
  Truck,
  Wifi,
  X,
} from 'lucide-react';

type ModuleId = 'inventario' | 'recebimento' | 'embarque' | 'precos' | 'validades' | 'auditoria';
type ModuleItem = {
  id: ModuleId;
  title: string;
  subtitle: string;
  icon: typeof Boxes;
  accent: string;
  badge?: string;
};

type ScanRecord = {
  code: string;
  format: string;
  module: ModuleId | 'rapido';
  time: string;
};

const modules: ModuleItem[] = [
  { id: 'inventario', title: 'Inventário', subtitle: 'Contagem e divergências', icon: Boxes, accent: 'cyan', badge: '12 abertos' },
  { id: 'recebimento', title: 'Recebimento', subtitle: 'NF, volumes e conferência', icon: PackageCheck, accent: 'green', badge: '4 docas' },
  { id: 'embarque', title: 'Embarque', subtitle: 'Separação e expedição', icon: Truck, accent: 'violet', badge: '7 cargas' },
  { id: 'precos', title: 'Auditoria de preços', subtitle: 'Gôndola x sistema', icon: Tag, accent: 'amber', badge: '32 pendentes' },
  { id: 'validades', title: 'Auditoria de validades', subtitle: 'Lotes e vencimentos', icon: CalendarClock, accent: 'rose', badge: '18 alertas' },
  { id: 'auditoria', title: 'Auditoria operacional', subtitle: 'Checklists e evidências', icon: ClipboardCheck, accent: 'blue' },
];

const sampleProducts: Record<string, { name: string; sku: string; price: string; location: string }> = {
  '7891000100103': { name: 'Produto demonstrativo 1L', sku: 'SKU 10482', price: 'R$ 12,99', location: 'A03 · M02 · P04' },
  '7894900011517': { name: 'Produto demonstrativo 350ml', sku: 'SKU 20931', price: 'R$ 5,49', location: 'A08 · M01 · P02' },
};

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastCode, setLastCode] = useState('7891000100103');
  const [records, setRecords] = useState<ScanRecord[]>([
    { code: '7891000100103', format: 'EAN-13', module: 'inventario', time: '08:42' },
    { code: '7894900011517', format: 'EAN-13', module: 'precos', time: '08:38' },
  ]);
  const [online] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wedgeBuffer = useRef('');
  const wedgeTimer = useRef<number | null>(null);

  const product = sampleProducts[lastCode] ?? {
    name: 'Item identificado',
    sku: `COD ${lastCode.slice(-6) || '---'}`,
    price: 'Preço não carregado',
    location: 'Endereço não carregado',
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT') return;
      if (event.key === 'Enter' && wedgeBuffer.current.length >= 4) {
        registerCode(wedgeBuffer.current, 'Scanner físico');
        wedgeBuffer.current = '';
        return;
      }
      if (event.key.length === 1) {
        wedgeBuffer.current += event.key;
        if (wedgeTimer.current) window.clearTimeout(wedgeTimer.current);
        wedgeTimer.current = window.setTimeout(() => (wedgeBuffer.current = ''), 180);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModule]);

  useEffect(() => () => stopCamera(), []);

  const registerCode = (code: string, format = 'Código') => {
    const clean = code.trim();
    if (!clean) return;
    setLastCode(clean);
    setRecords((current) => [
      { code: clean, format, module: activeModule?.id ?? 'rapido', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
      ...current,
    ].slice(0, 20));
    setManualCode('');
    setScannerOpen(false);
    stopCamera();
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      detectLoop();
    } catch {
      setCameraError('Não foi possível acessar a câmera. Use o leitor físico ou digite o código.');
    }
  };

  const detectLoop = async () => {
    const Detector = (window as unknown as { BarcodeDetector?: new (config?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string; format: string }>> } }).BarcodeDetector;
    if (!Detector || !videoRef.current) return;
    const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code', 'data_matrix', 'aztec', 'pdf417'] });
    const tick = async () => {
      if (!streamRef.current || !videoRef.current) return;
      try {
        const found = await detector.detect(videoRef.current);
        if (found[0]?.rawValue) {
          registerCode(found[0].rawValue, found[0].format || 'Camera');
          return;
        }
      } catch {
        // Continua tentando enquanto a câmera estiver ativa.
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const contextTitle = activeModule?.title ?? 'Operação Geral';
  const contextAccent = activeModule?.accent ?? 'cyan';

  const moduleMetrics = useMemo(() => {
    switch (activeModule?.id) {
      case 'inventario': return [['128', 'itens lidos'], ['94%', 'progresso'], ['7', 'divergências']];
      case 'recebimento': return [['42', 'volumes'], ['36', 'conferidos'], ['2', 'divergências']];
      case 'embarque': return [['18', 'volumes'], ['15', 'separados'], ['3', 'pendentes']];
      case 'precos': return [['64', 'auditados'], ['59', 'corretos'], ['5', 'ajustes']];
      case 'validades': return [['51', 'verificados'], ['6', 'alertas'], ['2', 'críticos']];
      case 'auditoria': return [['9', 'itens'], ['7', 'conformes'], ['2', 'evidências']];
      default: return [['6', 'módulos'], ['2', 'tarefas críticas'], ['98%', 'sincronizado']];
    }
  }, [activeModule]);

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div className="brand-row">
            {activeModule ? (
              <button className="icon-button" onClick={() => setActiveModule(null)} aria-label="Voltar"><ArrowLeft size={20} /></button>
            ) : (
              <div className="brand-mark"><ScanLine size={22} /></div>
            )}
            <div className="brand-copy">
              <span className="eyebrow">COLETOR OPERACIONAL</span>
              <strong>{contextTitle}</strong>
            </div>
            <div className="status-stack">
              <span className={`status-dot ${online ? 'online' : ''}`} />
              <span>{online ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="context-strip">
            <div><ShoppingCart size={15} /><span>Loja 01</span></div>
            <div><Wifi size={15} /><span>Wi-Fi</span></div>
            <div><Cloud size={15} /><span>Sync agora</span></div>
          </div>
        </header>

        <main className="content">
          {!activeModule ? (
            <>
              <section className="hero-card">
                <div>
                  <span className="eyebrow">TURNO ATUAL</span>
                  <h1>Bom dia, Operação.</h1>
                  <p>Escolha uma rotina ou faça uma leitura rápida.</p>
                </div>
                <div className="hero-orbit"><Smartphone size={26} /><span /></div>
              </section>

              <section className="quick-scan-card" onClick={() => setScannerOpen(true)}>
                <div className="scan-icon"><Barcode size={28} /></div>
                <div className="quick-copy">
                  <span className="eyebrow">LEITURA UNIVERSAL</span>
                  <strong>Escanear código</strong>
                  <small>EAN · UPC · Code 128 · QR · Data Matrix e mais</small>
                </div>
                <ChevronRight size={20} />
              </section>

              <div className="section-heading">
                <div><span className="eyebrow">ROTINAS</span><h2>Módulos operacionais</h2></div>
                <button className="ghost-button"><Layers3 size={15} /> Organizar</button>
              </div>

              <section className="module-grid">
                {modules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} className={`module-card accent-${item.accent}`} onClick={() => setActiveModule(item)}>
                      <div className="module-top"><span className="module-icon"><Icon size={22} /></span>{item.badge && <small>{item.badge}</small>}</div>
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                      <div className="module-footer"><span>Acessar rotina</span><ChevronRight size={17} /></div>
                    </button>
                  );
                })}
                <button className="module-card add-card">
                  <div className="module-top"><span className="module-icon"><Plus size={22} /></span></div>
                  <strong>Novo módulo</strong>
                  <span>Estrutura preparada para expansão</span>
                  <div className="module-footer"><span>Em breve</span></div>
                </button>
              </section>
            </>
          ) : (
            <>
              <section className={`module-hero accent-${contextAccent}`}>
                <div className="module-hero-title">
                  <span className="module-icon"><activeModule.icon size={24} /></span>
                  <div><span className="eyebrow">ROTINA ATIVA</span><h1>{activeModule.title}</h1></div>
                </div>
                <p>{activeModule.subtitle}. Fluxo preparado para operação por toque, câmera ou gatilho físico.</p>
              </section>

              <section className="metrics-row">
                {moduleMetrics.map(([value, label]) => <div className="metric-card" key={label}><strong>{value}</strong><span>{label}</span></div>)}
              </section>

              <button className="primary-scan" onClick={() => setScannerOpen(true)}>
                <span className="pulse-ring"><ScanLine size={30} /></span>
                <span><small>PRONTO PARA LEITURA</small><strong>Escanear próximo item</strong><em>Use câmera, leitor integrado ou digitação</em></span>
                <ChevronRight size={21} />
              </button>

              <section className="product-panel">
                <div className="product-header"><div><span className="eyebrow">ÚLTIMA LEITURA</span><h3>{product.name}</h3></div><span className="success-chip"><Check size={13} /> Lido</span></div>
                <div className="code-display"><Barcode size={24} /><div><strong>{lastCode}</strong><span>{product.sku}</span></div></div>
                <div className="product-details">
                  <div><span>Preço</span><strong>{product.price}</strong></div>
                  <div><span>Endereço</span><strong>{product.location}</strong></div>
                </div>
                <div className="action-row">
                  <button><Plus size={16} /> Quantidade</button>
                  <button><ShieldCheck size={16} /> Confirmar</button>
                </div>
              </section>

              <section className="activity-panel">
                <div className="section-heading compact"><div><span className="eyebrow">SESSÃO</span><h2>Últimas leituras</h2></div><span className="sync-label"><Cloud size={14} /> sincronizado</span></div>
                {records.slice(0, 4).map((record, index) => (
                  <div className="activity-item" key={`${record.code}-${index}`}>
                    <span className="activity-icon"><Barcode size={18} /></span>
                    <div><strong>{record.code}</strong><span>{record.format}</span></div>
                    <time>{record.time}</time>
                  </div>
                ))}
              </section>
            </>
          )}
        </main>

        <nav className="bottom-nav">
          <button className={!activeModule ? 'active' : ''} onClick={() => setActiveModule(null)}><Layers3 size={20} /><span>Módulos</span></button>
          <button onClick={() => setScannerOpen(true)} className="scan-nav"><span><ScanLine size={24} /></span><small>Escanear</small></button>
          <button><Clock3 size={20} /><span>Histórico</span></button>
          <button><Settings size={20} /><span>Ajustes</span></button>
        </nav>
      </div>

      {scannerOpen && (
        <div className="scanner-overlay">
          <div className="scanner-sheet">
            <div className="scanner-head">
              <div><span className="eyebrow">LEITOR UNIVERSAL</span><h2>Escanear código</h2></div>
              <button className="icon-button" onClick={() => { setScannerOpen(false); stopCamera(); }}><X size={20} /></button>
            </div>

            <div className={`camera-window ${cameraActive ? 'live' : ''}`}>
              <video ref={videoRef} playsInline muted />
              <div className="scan-corners"><i /><i /><i /><i /></div>
              <div className="laser-line" />
              {!cameraActive && <div className="camera-placeholder"><Camera size={32} /><strong>Câmera traseira</strong><span>Enquadre o código dentro da área</span></div>}
            </div>

            {cameraError && <div className="error-note"><CloudOff size={16} />{cameraError}</div>}

            <button className="camera-button" onClick={cameraActive ? stopCamera : startCamera}><Camera size={18} />{cameraActive ? 'Desligar câmera' : 'Ativar câmera'}</button>

            <div className="or-divider"><span>ou</span></div>

            <label className="manual-field">
              <span>Digitar / receber código do leitor físico</span>
              <div><Search size={18} /><input autoFocus={!cameraActive} value={manualCode} onChange={(e) => setManualCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && registerCode(manualCode, 'Manual')} placeholder="EAN, SKU, QR, serial..." /></div>
            </label>
            <button className="confirm-code" disabled={!manualCode.trim()} onClick={() => registerCode(manualCode, 'Manual')}>Confirmar leitura</button>

            <div className="supported-formats"><QrCode size={17} /><span>Compatível com leitores Android em modo teclado e câmera do aparelho. Formatos previstos: EAN-8/13, UPC-A/E, Code 39/93/128, ITF, Codabar, QR Code, Data Matrix, Aztec e PDF417.</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
