# Complete System Workflow & Role Interconnections

## 1. ROLE HIERARCHY & PERMISSIONS

### Roles (6 Total)
| Role | Level | Primary Functions |
|------|-------|-------------------|
| **Director** | Executive | Final approvals, Revenue targets, Company-wide analytics, Critical GP alerts |
| **Business Head** | Senior Management | Approvals, Deal oversight, GP monitoring, Strategic decisions |
| **Sales Manager** | Middle Management | Team management, Qualify opportunities, Set team targets |
| **Finance Manager** | Specialist | Invoicing, Receivables, Payables, TDS/Tax compliance |
| **Operations Manager** | Specialist | Program scheduling, Delivery, Vendor/Trainer management |
| **Sales Executive** | Entry | Client acquisition, Opportunity creation, Lead management |

---

## 2. COMPLETE WORKFLOW: OPPORTUNITY TO CASH

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SALES CYCLE WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SALES EXECUTIVE                    SALES MANAGER                            │
│  ┌──────────────┐                   ┌──────────────┐                        │
│  │ Create Client│ ──────────────────> │ View Team    │                      │
│  └──────┬───────┘                   │ Performance  │                        │
│         │                           └──────────────┘                        │
│         ▼                                  │                                │
│  ┌──────────────┐                          │                                │
│  │ Create       │                          │                                │
│  │ Opportunity  │ ─────────────────────────┤                                │
│  │ (Status: New)│                          │                                │
│  └──────┬───────┘                          ▼                                │
│         │                           ┌──────────────┐                        │
│         │                           │ Qualify      │                        │
│         └──────────────────────────>│ Opportunity  │                        │
│                                     │(Status:      │                        │
│                                     │ Qualified)   │                        │
│                                     └──────┬───────┘                        │
│                                            │                                │
│                                            ▼                                │
│                                     ┌──────────────┐                        │
│                                     │ Send to      │                        │
│                                     │ Delivery     │                        │
│                                     └──────┬───────┘                        │
│                                            │                                │
└────────────────────────────────────────────┼────────────────────────────────┘
                                             │
┌────────────────────────────────────────────┼────────────────────────────────┐
│                         APPROVAL WORKFLOW   │                                │
├─────────────────────────────────────────────┼───────────────────────────────┤
│                                             ▼                                │
│  BUSINESS HEAD / DIRECTOR            ┌──────────────┐                       │
│  ┌──────────────┐                    │ GP Analysis  │                       │
│  │ Review GP %  │<───────────────────│ (< 15% Alert)│                       │
│  └──────┬───────┘                    └──────────────┘                       │
│         │                                                                   │
│    ┌────┴────┐                                                              │
│    │         │                                                              │
│    ▼         ▼                                                              │
│ ┌──────┐  ┌──────┐                                                          │
│ │Approve│  │Reject│                                                          │
│ └──┬────┘  └──────┘                                                          │
│    │                                                                         │
└────┼────────────────────────────────────────────────────────────────────────┘
     │
┌────┼────────────────────────────────────────────────────────────────────────┐
│    │                    DEAL & OPERATIONS WORKFLOW                          │
├────┼────────────────────────────────────────────────────────────────────────┤
│    ▼                                                                        │
│ ┌──────────────┐        OPERATIONS MANAGER                                  │
│ │ Convert to   │        ┌──────────────┐                                    │
│ │ Deal         │───────>│ Create       │                                    │
│ └──────────────┘        │ Program      │                                    │
│                         └──────┬───────┘                                    │
│                                │                                            │
│                                ▼                                            │
│                         ┌──────────────┐                                    │
│                         │ Schedule     │                                    │
│                         │ Training     │                                    │
│                         │ - Trainers   │                                    │
│                         │ - Vendors    │                                    │
│                         │ - Materials  │                                    │
│                         └──────┬───────┘                                    │
│                                │                                            │
│                                ▼                                            │
│                         ┌──────────────┐                                    │
│                         │ Execute &    │                                    │
│                         │ Get Sign-off │                                    │
│                         └──────┬───────┘                                    │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────────┐
│                    FINANCE WORKFLOW │                                       │
├────────────────────────────────┼────────────────────────────────────────────┤
│                                ▼                                            │
│  FINANCE MANAGER        ┌──────────────┐                                    │
│                         │ Generate     │                                    │
│                         │ Invoice      │                                    │
│                         │ (IRN, E-way) │                                    │
│                         └──────┬───────┘                                    │
│                                │                                            │
│              ┌─────────────────┼─────────────────┐                          │
│              │                 │                 │                          │
│              ▼                 ▼                 ▼                          │
│       ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│       │ Create       │  │ Create       │  │ TDS          │                  │
│       │ Receivable   │  │ Payable      │  │ Calculation  │                  │
│       └──────┬───────┘  └──────┬───────┘  └──────────────┘                  │
│              │                 │                                            │
│              ▼                 ▼                                            │
│       ┌──────────────┐  ┌──────────────┐                                    │
│       │ Track        │  │ Process      │                                    │
│       │ Payments     │  │ Vendor       │                                    │
│       │              │  │ Payments     │                                    │
│       └──────────────┘  └──────────────┘                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ROLE-WISE FEATURE ACCESS MATRIX

| Feature | SE | SM | BH | DIR | FM | OM |
|---------|----|----|----|----|----|----|
| **Clients** | CRUD | View | View | View | View | View |
| **Opportunities** | Create/Edit Own | Qualify/Edit All | Approve/Reject | Approve/Reject | View | View |
| **Deals** | Create | Create | Create/Download | Full Access | View | Create |
| **Programs** | View | View | Approve | Approve | View | CRUD |
| **Invoices** | View | View | View | Full | CRUD | - |
| **Receivables** | - | - | - | Full | CRUD | - |
| **Payables** | - | - | - | Full | CRUD | - |
| **Vendors** | - | - | - | View | View | CRUD |
| **Revenue Targets** | View Own | Set Team | View | Set Global | View | View |
| **GP Alerts** | < 15% | < 15% | < 15% | < 10% | - | - |

*SE=Sales Executive, SM=Sales Manager, BH=Business Head, DIR=Director, FM=Finance Manager, OM=Operations Manager*

---

## 4. NOTIFICATION FLOW

### Event-Based Notifications
| Event | Creator Role | Notified Roles |
|-------|--------------|----------------|
| Opportunity Created | SE | SM, OM, FM, BH |
| Opportunity Created | SM | SE, OM, FM, BH |
| Opportunity Qualified | SM | OM, BH, FM |
| Opportunity Sent to Delivery | SM | OM, BH, FM |
| Opportunity Converted | Any | BH, DIR, FM |
| Opportunity Lost | Any | BH, DIR |
| Program Created | OM | OM, BH, DIR, FM |

---

## 5. DASHBOARD DATA INTERCONNECTIONS

### Sales Executive Dashboard
- **My Opportunities** → Links to Deals when converted
- **My Clients** → Links to Opportunities
- **Revenue Target** → Set by Director/SM
- **Low GP Alerts** → Deals with GP < 15%

### Sales Manager Dashboard
- **Team Members** → All Sales Executives under them
- **Team Opportunities** → All opportunities from team
- **Monthly Performance** → Aggregated from team opportunities
- **Set Targets** → Updates user targets in DB

### Business Head Dashboard
- **All Opportunities** → Company-wide visibility
- **Low GP Alerts** → Opportunities/Deals with GP < 15%
- **Approval Queue** → Pending approvals
- **Revenue Analytics** → Aggregated from all deals

### Director Dashboard
- **Company Revenue** → Aggregated from Invoices
- **Company Expenses** → Aggregated from Payables
- **Profit/Loss** → Revenue - Expenses
- **Critical GP Alerts** → Items with GP < 10%
- **Team Performance** → All sales team metrics
- **Revenue Targets** → Set and track company targets

### Finance Manager Dashboard
- **GP Analysis** → From Opportunities (Revenue - Expenses)
- **Client-wise GP** → Grouped by client
- **Vendor Expenses** → From Payables
- **Pending Invoices** → Invoice status tracking
- **Receivables/Payables** → Outstanding amounts
- **TDS Summary** → Tax compliance tracking

### Operations Manager Dashboard
- **Programs** → All active programs
- **Trainer Availability** → Scheduling
- **Fiscal Year Analytics** → Program performance
- **Vendor Management** → Material procurement

---

## 6. DATA FLOW CONNECTIONS

### Opportunity → Deal
```
Opportunity.opportunityStatus = 'Converted to Deal'
Opportunity.convertedToDealId = Deal._id
```

### Deal → Program
```
Program.dealId = Deal._id
Program inherits: clientName, courseName, tov
```

### Program → Invoice
```
Invoice.programId = Program._id
Requires: Program.clientSignOff = true
```

### Invoice → Receivable
```
Receivable.invoiceId = Invoice._id
Receivable.totalAmount = Invoice.totalAmount
```

### PurchaseOrder → Payable
```
Payable.purchaseOrderId = PurchaseOrder._id
Payable.vendorId = PurchaseOrder.vendorId
TDS calculated automatically
```

---

## 7. APPROVAL WORKFLOWS

### Opportunity Approval
1. SE creates opportunity (Status: New)
2. SM qualifies (Status: Qualified)
3. SM sends to delivery (Status: Sent to Delivery)
4. BH/DIR approves (Status: Approved) OR rejects (Status: Rejected)
5. Convert to Deal (Status: Converted to Deal)

### Program Approval
1. OM creates program
2. BH/DIR reviews training details
3. Approve/Reject training status

### Low GP Escalation
1. System flags items with GP < threshold
2. Role-specific thresholds:
   - SE/SM/BH: < 15%
   - Director: < 10%
3. Approval required to proceed

---

## 8. REAL-TIME DATA SHARING

All roles see real-time updates through:
- **Dashboard Refresh** on login
- **Notification System** for important events
- **Audit Trail** for all changes

### Cross-Role Visibility
| Data | Visible To |
|------|------------|
| All Opportunities | SM, BH, DIR, FM, OM |
| Own Opportunities | SE |
| All Deals | All roles |
| Programs | OM, FM, DIR, BH |
| Invoices | FM, DIR, BH, SM, SE |
| Receivables/Payables | FM, DIR |
| Revenue Targets | All roles (own/team) |

---

## 9. API ENDPOINTS BY ROLE

### Sales Executive
- `GET /dashboards/sales-executive`
- `POST /opportunities`
- `POST /clients`
- `GET /targets/:userId`

### Sales Manager
- `GET /dashboards/sales-manager`
- `PUT /opportunities/:id` (qualify/send to delivery)
- `GET /dashboards/sales-manager/team-members`
- `PUT /dashboards/sales-manager/set-target/:userId`

### Business Head
- `GET /dashboards/business`
- `PUT /opportunities/:id` (approve/reject)
- Low GP alert handling

### Director
- `GET /dashboards/director`
- `POST /revenue-targets`
- All approval actions
- Company-wide analytics

### Finance Manager
- `GET /dashboards/finance`
- `GET /dashboards/finance/client-gp`
- `GET /dashboards/finance/vendor-expenses`
- `POST /invoices`
- `POST /receivables`
- `POST /payables`

### Operations Manager
- `GET /dashboards/operations`
- `POST /programs`
- `POST /vendors`
- `POST /materials`

---

## 10. VERIFICATION CHECKLIST

✅ **Sales Flow**: SE → SM → BH/DIR → Deal
✅ **Operations Flow**: Deal → Program → Delivery
✅ **Finance Flow**: Program → Invoice → Receivable/Payable
✅ **Notification Flow**: Events trigger role-specific notifications
✅ **Dashboard Data**: Each role sees relevant aggregated data
✅ **GP Monitoring**: Threshold-based alerts by role
✅ **Target Management**: Director sets, cascades to team
✅ **Audit Trail**: All actions logged

---

*Document Generated: System Workflow Analysis*
