import React, { useState, useRef } from 'react';
import { 
  ClipboardCheck, ShieldAlert, FileDown, Camera, 
  MapPin, CheckCircle2, AlertCircle, Trash2, PenTool 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const DEFAULT_ZONES = [
  { id: 'desk', name: 'Study Desk & Chair', defaultItems: ['Surface chips/scratches', 'Drawer runner alignment', 'Chair wheels & upholstery'] },
  { id: 'bed', name: 'Bed Frame & Mattress', defaultItems: ['Mattress stains/sagging', 'Headboard stability', 'Under-bed storage latch'] },
  { id: 'window', name: 'Windows & Blinds', defaultItems: ['Blind slat condition', 'Window latch & draft seal', 'Mesh screen tears'] },
  { id: 'bath', name: 'Attached Washroom', defaultItems: ['Mirror condition', 'Faucet & drain pressure', 'Wall tiles & grout condition'] }
];

export default function App() {
  const [studentInfo, setStudentInfo] = useState({
    name: 'Aishini Kathuria',
    roomNo: 'Hostel H - Room 314',
    academicYear: '2026-2027',
    inspectionType: 'Move-In Audit'
  });

  const [activeZone, setActiveZone] = useState('desk');
  const [checkedItems, setCheckedItems] = useState({});
  const [damageNotes, setDamageNotes] = useState('');
  const [sampleImage, setSampleImage] = useState('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80');
  const [pins, setPins] = useState([
    { id: 1, x: 42, y: 55, note: 'Deep finish gouge on left armrest' },
    { id: 2, x: 68, y: 78, note: 'Front desk edge laminate peel' }
  ]);
  const [selectedPin, setSelectedPin] = useState(null);

  const imgContainerRef = useRef(null);

  const toggleCheck = (itemKey) => {
    setCheckedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  // Add damage pin on canvas/image click
  const handleImageClick = (e) => {
    if (!imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const note = prompt('Describe the damage spotted at this pin coordinate:', damageNotes || 'Cosmetic scuff/scratch');
    if (note) {
      const newPin = { id: Date.now(), x, y, note };
      setPins(prev => [...prev, newPin]);
      setSelectedPin(newPin);
      setDamageNotes('');
    }
  };

  const removePin = (pinId) => {
    setPins(prev => prev.filter(p => p.id !== pinId));
    if (selectedPin?.id === pinId) setSelectedPin(null);
  };

  // Instant Client-Side PDF Generation via jsPDF
  const exportPDFReport = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Header Band
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DormAudit - Move-In Condition Certificate', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Official University Asset Registry Report | Generated: ${dateStr}`, 14, 25);

    // Metadata Block
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INSPECTION METADATA', 14, 44);
    doc.line(14, 46, 196, 46);

    doc.setFont('helvetica', 'normal');
    doc.text(`Student Name: ${studentInfo.name}`, 14, 54);
    doc.text(`Assigned Unit: ${studentInfo.roomNo}`, 14, 62);
    doc.text(`Term: ${studentInfo.academicYear}`, 120, 54);
    doc.text(`Audit Stage: ${studentInfo.inspectionType}`, 120, 62);

    // Checklist Verification Table
    doc.setFont('helvetica', 'bold');
    doc.text('CHECKLIST VERIFICATIONS', 14, 76);
    doc.line(14, 78, 196, 78);

    let yOffset = 86;
    DEFAULT_ZONES.forEach((zone) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`[${zone.name.toUpperCase()}]`, 14, yOffset);
      yOffset += 6;
      doc.setFont('helvetica', 'normal');

      zone.defaultItems.forEach(item => {
        const key = `${zone.id}-${item}`;
        const isVerified = checkedItems[key];
        const status = isVerified ? '[PASSED / CLEAN]' : '[MARKED ATTENTION]';
        doc.text(`• ${item}: ${status}`, 18, yOffset);
        yOffset += 5;
      });
      yOffset += 3;
    });

    // Tagged Physical Damage Pins
    yOffset += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DOCUMENTED ASSET DEFECTS & VISUAL PINS', 14, yOffset);
    doc.line(14, yOffset + 2, 196, yOffset + 2);
    yOffset += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (pins.length === 0) {
      doc.text('Zero pre-existing defects logged. Room received in immaculate condition.', 14, yOffset);
      yOffset += 10;
    } else {
      pins.forEach((p, idx) => {
        doc.text(`Pin #${idx + 1} (Coords X:${p.x}%, Y:${p.y}%): ${p.note}`, 14, yOffset);
        yOffset += 6;
      });
    }

    // Signatures
    yOffset += 16;
    doc.setFont('helvetica', 'bold');
    doc.text('ACKNOWLEDGMENT & SIGNATURES', 14, yOffset);
    doc.line(14, yOffset + 2, 196, yOffset + 2);
    yOffset += 18;

    doc.setFont('helvetica', 'normal');
    doc.text('__________________________________', 14, yOffset);
    doc.text('__________________________________', 120, yOffset);
    yOffset += 5;
    doc.text('Resident Student Signature', 14, yOffset);
    doc.text('Hostel Warden / Housing Authority', 120, yOffset);

    doc.save(`DormAudit_${studentInfo.roomNo.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', background: '#0284c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardCheck size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>DormAudit</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Digital Room Inspection & Deposit Protection Ledger</p>
          </div>
        </div>

        <button
          onClick={exportPDFReport}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileDown size={16} /> Export Verified PDF
        </button>
      </header>

      {/* Main Form & Canvas Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
        
        {/* Left Column: Visual Damage Pinning Studio */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PenTool size={18} color="#38bdf8" /> Photographic Pin-Annotation
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Click anywhere on the asset photo to pin pre-existing scuffs or damage</p>
              </div>
              <span style={{ fontSize: '11px', background: '#0369a1', color: '#e0f2fe', padding: '4px 8px', borderRadius: '6px' }}>
                {pins.length} Tagged Pins
              </span>
            </div>

            {/* Interactive Image Pin Board */}
            <div 
              ref={imgContainerRef}
              onClick={handleImageClick}
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'crosshair',
                border: '2px solid #334155',
                height: '340px',
                background: '#020617'
              }}
            >
              <img 
                src={sampleImage} 
                alt="Room desk view" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.85 }} 
              />

              {/* Pins Render */}
              {pins.map((pin, idx) => (
                <div
                  key={pin.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(pin);
                  }}
                  style={{
                    position: 'absolute',
                    top: `${pin.y}%`,
                    left: `${pin.x}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: selectedPin?.id === pin.id ? '#f59e0b' : '#ef4444',
                    border: '2px solid #ffffff',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(0,0,0,0.6)',
                    cursor: 'pointer'
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Pin Description Feed */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Logged Defects for Current Photo:</span>
              {pins.map((pin, idx) => (
                <div 
                  key={pin.id}
                  style={{
                    background: selectedPin?.id === pin.id ? '#1e293b' : '#030712',
                    border: selectedPin?.id === pin.id ? '1px solid #38bdf8' : '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '700', color: '#ef4444', marginRight: '6px' }}>Pin #{idx + 1}:</span>
                    <span>{pin.note}</span>
                  </div>
                  <button 
                    onClick={() => removePin(pin.id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Zone Inspection Checklist & Metadata */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Metadata Card */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 10px 0', color: '#cbd5e1' }}>Room & Student Metadata</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>Student Name</label>
                <input 
                  type="text" 
                  value={studentInfo.name} 
                  onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>Assigned Unit / Room</label>
                <input 
                  type="text" 
                  value={studentInfo.roomNo} 
                  onChange={(e) => setStudentInfo({...studentInfo, roomNo: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Zone Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {DEFAULT_ZONES.map(z => (
              <button
                key={z.id}
                onClick={() => setActiveZone(z.id)}
                style={{
                  background: activeZone === z.id ? '#0284c7' : '#1e293b',
                  color: activeZone === z.id ? '#ffffff' : '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {z.name}
              </button>
            ))}
          </div>

          {/* Active Zone Checklist */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', color: '#f8fafc' }}>
              Condition Verification: {DEFAULT_ZONES.find(z => z.id === activeZone)?.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEFAULT_ZONES.find(z => z.id === activeZone)?.defaultItems.map(item => {
                const key = `${activeZone}-${item}`;
                const checked = !!checkedItems[key];
                return (
                  <div
                    key={item}
                    onClick={() => toggleCheck(key)}
                    style={{
                      background: checked ? '#064e3b' : '#1e293b',
                      border: checked ? '1px solid #10b981' : '1px solid #334155',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '13px', color: checked ? '#a7f3d0' : '#e2e8f0', fontWeight: '500' }}>{item}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: checked ? '#059669' : '#374151', color: '#fff' }}>
                      {checked ? 'Verified Passed' : 'Needs Check'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}