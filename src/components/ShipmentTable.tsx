import { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/styles/ag-grid-custom.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Filter, Eye } from "lucide-react";

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Shipment {
  id: string;
  status: string;
  origin: string;
  route: string;
  departure: string;
  arrival: string;
  delivery: string;
  tradeParty: string;
}

const shipments: Shipment[] = [
  {
    id: "FD2032-084236",
    status: "Out for Delivery",
    origin: "N/A",
    route: "Shanghai → Rotterdam",
    departure: "16/03/2025",
    arrival: "16/03/2025",
    delivery: "16/03/2025",
    tradeParty: "XYZ Shipper China",
  },
  {
    id: "FD2032-084237",
    status: "Booked for Delivery",
    origin: "N/A",
    route: "Shanghai → Rotterdam",
    departure: "16/03/2025",
    arrival: "16/03/2025",
    delivery: "16/03/2025",
    tradeParty: "XYZ Shipper China",
  },
  {
    id: "FD2032-084106",
    status: "Booked for Delivery",
    origin: "N/A",
    route: "Rotterdam → Ashland",
    departure: "16/03/2025",
    arrival: "16/03/2025",
    delivery: "16/03/2025",
    tradeParty: "ABC Buyer New Zealand",
  },
  {
    id: "FD2032-084238",
    status: "Awaiting Arrival",
    origin: "N/A",
    route: "Shanghai → Rotterdam",
    departure: "16/03/2025",
    arrival: "16/03/2025",
    delivery: "16/03/2025",
    tradeParty: "XYZ Shipper China",
  },
  {
    id: "FD2032-084239",
    status: "Awaiting Arrival",
    origin: "N/A",
    route: "Rotterdam → Ashland",
    departure: "16/03/2025",
    arrival: "16/03/2025",
    delivery: "16/03/2025",
    tradeParty: "ABC Buyer New Zealand",
  },
  {
    id: "FD2032-084240",
    status: "Awaiting Arrival",
    origin: "N/A",
    route: "Shanghai → Rotterdam",
    departure: "16/03/2025",
    arrival: "16/03/2025",
    delivery: "16/03/2025",
    tradeParty: "XYZ Shipper China",
  },
];

const getStatusColor = (status: string) => {
  if (status.includes("Delivery")) return "bg-success/10 text-success hover:bg-success/20";
  if (status.includes("Arrival")) return "bg-info/10 text-info hover:bg-info/20";
  return "bg-warning/10 text-warning hover:bg-warning/20";
};

// Custom Status Cell Renderer
const StatusCellRenderer = (props: any) => {
  return (
    <Badge variant="secondary" className={getStatusColor(props.value)}>
      {props.value}
    </Badge>
  );
};

// Custom Action Cell Renderer
const ActionCellRenderer = (props: any) => {
  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Eye className="h-4 w-4" />
    </Button>
  );
};

const ShipmentTable = () => {
  const gridRef = useRef<AgGridReact>(null);

  // Column Definitions with all features
  const columnDefs: ColDef<Shipment>[] = useMemo(() => [
    {
      headerName: 'OUR REFERENCE',
      field: 'id',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: 'left',
      width: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'STATUS',
      field: 'status',
      cellRenderer: StatusCellRenderer,
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'ORIGIN',
      field: 'origin',
      width: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'ROUTE',
      field: 'route',
      width: 220,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'DEPARTURE',
      field: 'departure',
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'ARRIVAL',
      field: 'arrival',
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'DELIVERY',
      field: 'delivery',
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'TRADE PARTY',
      field: 'tradeParty',
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
    },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionCellRenderer,
      width: 100,
      pinned: 'right',
      sortable: false,
      filter: false,
    },
  ], []);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    editable: false,
    enableCellChangeFlash: true,
    floatingFilter: true,
    suppressMenu: false,
  }), []);

  // Grid Ready Event
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Export to CSV
  const onExportCSV = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: 'shipments-export.csv',
    });
  }, []);

  // Clear Filters
  const onClearFilters = useCallback(() => {
    gridRef.current?.api?.setFilterModel(null);
  }, []);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <Button 
          onClick={onExportCSV} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button 
          onClick={onClearFilters} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>

      {/* AG Grid Table */}
      <div className="ag-theme-alpine rounded-lg border border-border overflow-hidden" style={{ height: 600, width: '100%' }}>
        <AgGridReact<Shipment>
          ref={gridRef}
          rowData={shipments}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          rowSelection="multiple"
          animateRows={true}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          suppressRowClickSelection={true}
          domLayout="normal"
          suppressContextMenu={false}
          allowContextMenuWithControlKey={true}
          getContextMenuItems={() => [
            'copy',
            'copyWithHeaders',
            'separator',
            'export',
          ]}
        />
      </div>
    </div>
  );
};

export default ShipmentTable;
