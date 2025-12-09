# Setup Sheet / Tool Life Journal - Implementation Guide

## Overview
Complete production-ready module for tracking injection molding machine setup parameters and run history.

## Features
- **Fixed Tool Data** - Display mold specs (header/read-only)
- **Run History** - Full journal of every production run
- **Quick Entry Form** - Mobile-optimized for floor operators (<60 sec data entry)
- **QR Code Flow** - Scan tool → open sheet → add run instantly
- **Auto-increment** - Run numbers auto-increment per tool
- **Export Ready** - All data available via REST API for CSV/PDF export

---

## 1. Backend (ASP.NET Core + EF Core)

### Database Table: `ToolRuns`
```sql
CREATE TABLE ToolRuns (
    Id INT PRIMARY KEY IDENTITY,
    MoldId INT NOT NULL FOREIGN KEY REFERENCES Molds(MoldID),
    RunNumber INT NOT NULL,
    PressNumber NVARCHAR(50) NOT NULL,
    RunDateTime DATETIME2 NOT NULL,
    OperatorInitials NVARCHAR(50) NOT NULL,
    -- Materials
    Resin NVARCHAR(100),
    Colorant NVARCHAR(100),
    LotNumber NVARCHAR(100),
    -- Temperatures (°F)
    TempFeed DECIMAL(10,2),
    TempRear1 DECIMAL(10,2),
    TempRear2 DECIMAL(10,2),
    TempMiddle DECIMAL(10,2),
    TempFront1 DECIMAL(10,2),
    TempFront2 DECIMAL(10,2),
    TempMoldLiveHalf DECIMAL(10,2),
    TempMoldDeadHalf DECIMAL(10,2),
    -- Pressures (PSI)
    Pressure1stStage DECIMAL(10,2),
    Pressure2ndStage DECIMAL(10,2),
    PressureBack DECIMAL(10,2),
    PressureClamping DECIMAL(10,2),
    -- Cycle Times (seconds)
    TimeInject DECIMAL(10,2),
    Time2ndStage DECIMAL(10,2),
    TimeMoldClose DECIMAL(10,2),
    TimeMoldOpen DECIMAL(10,2),
    TimeOverallCycle DECIMAL(10,2),
    InjectionSpeed DECIMAL(10,2),
    PackHoldTime DECIMAL(10,2),
    -- Other
    Cushion DECIMAL(10,2),
    ScrewRPM DECIMAL(10,2),
    FullShotWeight DECIMAL(10,2),
    PartOnlyWeight DECIMAL(10,2),
    Notes NVARCHAR(1000),
    -- Audit
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2
);
```

### REST API Endpoints
```
GET    /api/molds/{moldId}/tool-runs          - List all runs for a mold
GET    /api/molds/{moldId}/tool-runs/{id}     - Get specific run details
POST   /api/molds/{moldId}/tool-runs          - Create new run (auto-increment)
GET    /api/molds/{moldId}/tool-runs/header   - Get mold header data
```

### Create Migration
```bash
cd C:\Users\jorda\source\repos\CatalystERP\CatalystERP.Api
dotnet ef migrations add AddToolRunsTable
dotnet ef database update
```

---

## 2. Frontend (React + TypeScript + Material-UI)

### Routes
- `/molds/:moldId/setup-sheet` - Main setup sheet page
- `/molds/:moldId/setup-sheet?addRun=true` - Opens with Add Run form

### Components
- **SetupSheet.tsx** - Main page with Header/Run History tabs
- **AddRunForm.tsx** - Full data entry form (all fields organized by section)

### Usage
1. Navigate to Molds page
2. Click "Setup Sheet" button on any mold
3. **Header Tab** - View fixed tool data (customer, part name, cavities, etc.)
4. **Run History Tab** - View all runs + click "+ Add Run"
5. Fill form (required: Press #, Operator Initials)
6. Save → run number auto-increments

---

## 3. Mobile QR Code Flow

### Generate QR Codes
Print physical setup sheets with QR codes linking to:
```
https://yourdomain.com/molds/{moldId}/setup-sheet?addRun=true
```

### Operator Workflow
1. **Scan QR code** on physical setup sheet attached to tool
2. **Browser opens** → directly to Add Run form
3. **Fill required fields** (Press #, Operator, temps, pressures, times)
4. **Save** → Done in <60 seconds
5. **History automatically tracked** for management review

### QR Code Generation (Example)
```javascript
import QRCode from 'qrcode';

// Generate for Mold #102116
const moldId = 123;
const url = `https://leevalleymolding.com/molds/${moldId}/setup-sheet?addRun=true`;

QRCode.toCanvas(document.getElementById('qr-canvas'), url, { width: 200 });
```

---

## 4. Field Reference

### Required Fields
- Press # (which machine)
- Date/Time (auto-filled, editable)
- Operator Initials

### Optional Fields (capture what's relevant)
- **Materials**: Resin, Colorant, Lot Number
- **Temperatures**: Feed, Rear 1, Rear 2, Middle, Front 1, Front 2, Mold Live/Dead Half
- **Pressures**: 1st Stage, 2nd Stage, Back Pressure, Clamping
- **Cycle Times**: Inject, 2nd Stage, Mold Close/Open, Overall Cycle, Injection Speed, P.B.
- **Other**: Cushion, Screw RPM, Full Shot Weight, Part Only Weight
- **Notes**: Downtime, issues, special notes

---

## 5. Future Enhancements

### Export to CSV
```csharp
[HttpGet("export")]
public async Task<IActionResult> ExportToCsv(int moldId)
{
    var runs = await _context.ToolRuns
        .Where(tr => tr.MoldId == moldId)
        .OrderBy(tr => tr.RunNumber)
        .ToListAsync();

    // Generate CSV, return File()
}
```

### Analytics Dashboard
- Actual vs Standard Rate comparison
- Average cycle time trends
- Temperature/pressure variance analysis
- Operator performance metrics

### Notifications
- Alert when run parameters deviate from standards
- Email report summaries (daily/weekly)

---

## 6. Testing Checklist

- [ ] Create migration and update database
- [ ] Test GET /api/molds/{moldId}/tool-runs (empty list)
- [ ] Test POST with required fields only
- [ ] Verify auto-increment run numbers
- [ ] Test POST with all fields populated
- [ ] Navigate to Setup Sheet page
- [ ] View Header tab (fixed data)
- [ ] Click "+ Add Run" button
- [ ] Fill form and save
- [ ] Verify run appears in history table
- [ ] Test QR code link with ?addRun=true
- [ ] Test on mobile device (form responsiveness)

---

## 7. Deployment Notes

### Environment Variables
Ensure API connection string is configured for production database.

### Performance
- Index on `ToolRuns.MoldId` for fast queries
- Index on `ToolRuns.RunDateTime` for history sorting

### Security
- All endpoints require authentication ([Authorize] attribute)
- Consider role-based access (operators vs management)

---

## Support
For issues or questions, contact the development team or refer to the main ERP documentation.
