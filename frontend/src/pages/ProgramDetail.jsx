import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Table.css';
import { useModal } from '../contexts/context/ModalContext.jsx';

const ProgramDetail = ({ user, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const modal = useModal();

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const response = await api.get(`/programs/${id}`);
      setProgram(response.data);
      
      // If program is linked to an opportunity, use the populated opportunity data
      if (response.data.opportunityId && typeof response.data.opportunityId === 'object') {
        setOpportunity(response.data.opportunityId);
      } else if (response.data.opportunityId) {
        // If opportunityId is just an ID string, try to fetch it (but handle 403 gracefully)
        try {
          const oppResponse = await api.get(`/opportunities/${response.data.opportunityId}`);
          setOpportunity(oppResponse.data);
        } catch (error) {
          // Silently fail if user doesn't have access - Adhoc ID will show as N/A
          console.error('Error fetching opportunity:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching program:', error);
      modal.alert({
        title: 'Error',
        message: 'Error loading program details',
        okText: 'Close',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const buildReportHtml = () => {
    const safe = (v) => (v === undefined || v === null || v === '' ? 'N/A' : String(v));
    const dateText = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');
    const money = (n) => `₹${(Number(n) || 0).toLocaleString()}`;

    const title = `Program Report - ${program?.courseName || program?.programName || program?._id || ''}`;

    const infoRows = [
      ['Adhoc ID', safe(opportunity?.opportunityId || program?.adhocId)],
      ['Status', safe(program?.trainingStatus || program?.deliveryStatus || 'Scheduled')],
      ['Training Opportunity', safe(program?.trainingOpportunity)],
      ['Training Sector', safe(program?.trainingSector)],
      ['Training Supporter', safe(program?.trainingSupporter)],
      ['Sales', safe(program?.sales)],
      ['Training Year', safe(program?.trainingYear)],
      ['Training Month', safe(program?.trainingMonth)],
      ['Billing Client', safe(program?.billingClient || program?.clientName)],
      ['End Client', safe(program?.endClient || program?.clientName)],
      ['Course Code', safe(program?.courseCode)],
      ['Course Name', safe(program?.courseName || program?.programName)],
      ['Technology', safe(program?.technology || program?.technologyOther)],
      ['Number of Participants', safe(program?.numberOfParticipants)],
      ['Attendance', safe(program?.attendance)],
      ['Start Date', safe(dateText(program?.startDate))],
      ['End Date', safe(dateText(program?.endDate))],
      ['Number of Days', safe(program?.numberOfDays)],
      ['Location', safe(program?.location)],
      ['Training Location', program?.location && (program.location === 'Classroom' || program.location === 'Hybrid' || program.location === 'Classroom / Hybrid') ? safe(program?.trainingLocation) : 'N/A'],
      ['Trainer(s)', Array.isArray(program?.trainers) ? (program.trainers.join(', ') || 'N/A') : safe(program?.trainers)]
    ];

    const financialRows = [
      ['TOV (Total Order Value)', money(program?.tov)],
      ['PO', safe(program?.po)],
      ['PO Date', safe(dateText(program?.poDate))],
      ['Invoice Number', safe(program?.invoiceNumber)],
      ['Invoice Date', safe(dateText(program?.invoiceDate))],
      ['Payment Terms', safe(program?.paymentTerms)],
      ['Payment Date', safe(dateText(program?.paymentDate))]
    ];

    const costRows = [
      ['Trainer PO Values', money(program?.trainerPOValues)],
      ['Lab PO Value', money(program?.labPOValue)],
      ['Course Material', money(program?.courseMaterial)],
      ['Royalty Charges', money(program?.royaltyCharges)],
      ['Venue', safe(program?.venue)],
      ['Travel Charges', money(program?.travelCharges)],
      ['Accommodation', money(program?.accommodation)],
      ['Per Diem', money(program?.perDiem)],
      ['Local Conveyance', money(program?.localConveyance)],
      ['Marketing Charges', program?.marketingChargesPercent ? `${money(program?.marketingChargesAmount)} (${safe(program?.marketingChargesPercent)}%)` : money(program?.marketingChargesAmount)],
      ['Contingency', program?.contingencyPercent ? `${money(program?.contingencyAmount)} (${safe(program?.contingencyPercent)}%)` : money(program?.contingencyAmount)],
      ['Total Expenses', money((Number(program?.tov) || 0) - (Number(program?.finalGP) || 0))],
      ['Final GP', program?.tov && Number(program?.tov) > 0 ? `${(((Number(program?.finalGP) || 0) / Number(program?.tov)) * 100).toFixed(2)}% (${money(program?.finalGP)})` : money(program?.finalGP)]
    ];

    const section = (heading, rows) => {
      const trs = rows
        .map(([k, v]) => `
          <tr>
            <td class="k">${k}</td>
            <td class="v">${String(v).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          </tr>`)
        .join('');
      return `
        <div class="card">
          <div class="card-title">${heading}</div>
          <table class="table">
            <tbody>
              ${trs}
            </tbody>
          </table>
        </div>`;
    };

    const generatedAt = new Date().toLocaleString();

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
          <style>
            *{box-sizing:border-box;}
            body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; color:#0f172a;background:#fff;}
            .topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#ffffff;}
            .topbar .left{font-weight:900;letter-spacing:.2px;}
            .topbar .actions{display:flex;gap:10px;}
            .btn{border:1px solid #e2e8f0;background:#0f172a;color:#fff;border-radius:10px;padding:10px 12px;font-weight:900;font-size:13px;cursor:pointer;}
            .btn.secondary{background:#fff;color:#0f172a;}
            .page{max-width: 900px;margin: 0 auto;padding: 28px;}
            .header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;}
            .brand{font-weight:900;font-size:16px;letter-spacing:.2px;}
            .subtitle{color:#64748b;font-size:12px;margin-top:4px;}
            .h1{font-size:22px;font-weight:900;margin:0;}
            .pill{display:inline-block;padding:6px 10px;border:1px solid #e2e8f0;border-radius:999px;font-size:12px;color:#334155;background:#f8fafc;}
            .grid{display:grid;grid-template-columns:1fr;gap:14px;}
            .card{border:1px solid #e2e8f0;border-radius:14px;padding:14px 14px 10px;background:#fff;}
            .card-title{font-weight:900;font-size:13px;margin:0 0 10px 0;letter-spacing:.3px;text-transform:uppercase;color:#0f172a;}
            .table{width:100%;border-collapse:collapse;}
            td{padding:10px 8px;border-top:1px solid #f1f5f9;vertical-align:top;}
            tr:first-child td{border-top:none;}
            .k{width:42%;color:#334155;font-weight:800;font-size:12px;letter-spacing:.2px;}
            .v{color:#0f172a;font-weight:700;font-size:13px;}
            .footer{margin-top:18px;color:#64748b;font-size:11px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;}
            @media print{
              body{background:#fff;}
              .topbar{display:none;}
              .page{max-width:none;padding:0.6in;}
              .card{break-inside:avoid;page-break-inside:avoid;}
            }
          </style>
        </head>
        <body>
          <div class="topbar">
            <div class="left">Report Viewer</div>
            <div class="actions">
              <button class="btn secondary" onclick="window.close()">Close</button>
              <button class="btn" onclick="window.print()">Print</button>
            </div>
          </div>
          <div class="page">
            <div class="header">
              <div>
                <div class="brand">GKT - CRM</div>
                <div class="subtitle">Generated: ${generatedAt}</div>
              </div>
              <div style="text-align:right">
                <div class="h1">Program Report</div>
                <div class="subtitle">${String(program?.courseName || program?.programName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>
            </div>
            <div class="grid">
              ${section('Program Details', infoRows)}
              ${section('Financial Information', financialRows)}
              ${section('Cost Breakdown', costRows)}
            </div>
            <div class="footer">
              <div class="pill">User: ${String(user?.name || user?.email || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              <div class="pill">Program ID: ${String(program?._id || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
          </div>
        </body>
      </html>`;
  };

  const openPrintWindow = () => {
    const html = buildReportHtml();
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      modal.alert({ title: 'Popup Blocked', message: 'Please allow popups to view/print the report.', okText: 'Close', type: 'warning' });
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const downloadReport = async () => {
    try {
      const html = buildReportHtml();
      const title = `Program Report - ${program?.courseName || program?.programName || program?._id || ''}`;

      const response = await api.post('/auth/downloads', {
        title,
        type: 'program-report',
        contentHtml: html
      });

      if (setUser && response?.data?.user) setUser(response.data.user);

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, ' ').trim().slice(0, 80)}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      window.dispatchEvent(new CustomEvent('openDownloadsPanel'));
    } catch (error) {
      modal.alert({
        title: 'Download Failed',
        message: error.response?.data?.error || 'Unable to download report',
        okText: 'Close',
        type: 'danger'
      });
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading program details...</div>;
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Program Details</h1>
        <button 
          onClick={() => navigate('/')} 
          className="btn-close"
          title="Close and return to Dashboard"
        >
          ×
        </button>
      </div>

      <div className="form-card">
        <h2>Program Information</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>Adhoc ID</strong></label>
            <div className="display-field strong">
              {opportunity?.opportunityId || program.adhocId || 'N/A'}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Status</strong></label>
            <div>
              <span className={`status-badge ${(program.trainingStatus || program.deliveryStatus || '').toLowerCase().replace(' ', '-')}`}>
                {program.trainingStatus || program.deliveryStatus || 'Scheduled'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label><strong>Training Opportunity</strong></label>
            <div>{program.trainingOpportunity || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Sector</strong></label>
            <div>{program.trainingSector || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Supporter</strong></label>
            <div>{program.trainingSupporter || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Sales</strong></label>
            <div>{program.sales || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Year</strong></label>
            <div>{program.trainingYear || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Training Month</strong></label>
            <div>{program.trainingMonth || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Billing Client</strong></label>
            <div>{program.billingClient || program.clientName || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>End Client</strong></label>
            <div>{program.endClient || program.clientName || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Course Code</strong></label>
            <div>{program.courseCode || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Course Name</strong></label>
            <div>{program.courseName || program.programName || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Technology</strong></label>
            <div>{program.technology || program.technologyOther || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Number of Participants</strong></label>
            <div>{program.numberOfParticipants || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Attendance</strong></label>
            <div>{program.attendance !== undefined && program.attendance !== null ? program.attendance : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Start Date</strong></label>
            <div>{program.startDate ? new Date(program.startDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>End Date</strong></label>
            <div>{program.endDate ? new Date(program.endDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Number of Days</strong></label>
            <div>{program.numberOfDays || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Location</strong></label>
            <div>{program.location || 'N/A'}</div>
          </div>

          {program.location && (program.location === 'Classroom' || program.location === 'Hybrid' || program.location === 'Classroom / Hybrid') && (
            <div className="form-group">
              <label><strong>Training Location</strong></label>
              <div>{program.trainingLocation || 'N/A'}</div>
            </div>
          )}

          <div className="form-group">
            <label><strong>Trainers</strong></label>
            <div>
              {Array.isArray(program.trainers) && program.trainers.length > 0
                ? program.trainers.join(', ')
                : (program.trainers || 'N/A')}
            </div>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginTop: '24px' }}>
        <h2>Financial Information</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>TOV (Total Order Value)</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              ₹{(program.tov || 0).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label><strong>PO</strong></label>
            <div>{program.po || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>PO Date</strong></label>
            <div>{program.poDate ? new Date(program.poDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Invoice Number</strong></label>
            <div>{program.invoiceNumber || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Invoice Date</strong></label>
            <div>{program.invoiceDate ? new Date(program.invoiceDate).toLocaleDateString() : 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Payment Terms</strong></label>
            <div>{program.paymentTerms || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Payment Date</strong></label>
            <div>{program.paymentDate ? new Date(program.paymentDate).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginTop: '24px' }}>
        <h2>Cost Breakdown</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label><strong>Trainer PO Values</strong></label>
            <div>₹{(program.trainerPOValues || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Lab PO Value</strong></label>
            <div>₹{(program.labPOValue || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Course Material</strong></label>
            <div>₹{(program.courseMaterial || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Royalty Charges</strong></label>
            <div>₹{(program.royaltyCharges || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Venue</strong></label>
            <div>{program.venue || 'N/A'}</div>
          </div>

          <div className="form-group">
            <label><strong>Travel Charges</strong></label>
            <div>₹{(program.travelCharges || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Accommodation</strong></label>
            <div>₹{(program.accommodation || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Per Diem</strong></label>
            <div>₹{(program.perDiem || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Local Conveyance</strong></label>
            <div>₹{(program.localConveyance || 0).toLocaleString()}</div>
          </div>

          <div className="form-group">
            <label><strong>Marketing Charges</strong></label>
            <div>
              ₹{(program.marketingChargesAmount || 0).toLocaleString()}
              {program.marketingChargesPercent ? ` (${program.marketingChargesPercent}%)` : ''}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Contingency</strong></label>
            <div>
              ₹{(program.contingencyAmount || 0).toLocaleString()}
              {program.contingencyPercent ? ` (${program.contingencyPercent}%)` : ''}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Total Expenses</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
              ₹{((program.tov || 0) - (program.finalGP || 0)).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label><strong>Final GP (Gross Profit)</strong></label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: program.finalGP >= 0 ? '#28a745' : '#dc3545' }}>
              {program.tov && program.tov > 0 
                ? `${((program.finalGP || 0) / program.tov * 100).toFixed(2)}% (₹${(program.finalGP || 0).toLocaleString()})`
                : `₹${(program.finalGP || 0).toLocaleString()}`
              }
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={() => {
            openPrintWindow();
          }}
          className="btn-primary"
          style={{ marginRight: '10px' }}
        >
          View Report / Print
        </button>
        <button
          onClick={() => {
            downloadReport();
          }}
          className="btn-secondary"
          style={{ marginRight: '10px' }}
        >
          Download Report
        </button>
        <button
          onClick={() => navigate('/programs')}
          className="btn-secondary"
        >
          Back to Programs
        </button>
      </div>
    </div>
  );
};

export default ProgramDetail;
