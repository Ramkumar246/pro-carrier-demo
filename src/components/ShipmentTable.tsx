import { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule ,themeQuartz} from 'ag-grid-community';
import { AllEnterpriseModule, IntegratedChartsModule, LicenseManager } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import type { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Filter, BarChart2, RefreshCw, ChevronDown, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";

// Register AG Grid Community + Enterprise modules with Charts
ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule)
]);

// Set up license key placeholder so enterprise watermark is displayed until replaced
LicenseManager.setLicenseKey(
  import.meta.env?.VITE_AG_GRID_LICENSE_KEY ??
  "This is a development-only AG Grid Enterprise evaluation. Replace with your license key."
);

export type TransportMode = "Sea" | "Air" | "Road";

export interface Shipment {
  id: string;
  status: string;
  origin: string;
  route: string;
  transportMode: TransportMode;
  departure: string;
  arrival: string;
  delivery: string; // Original delivery date
  deliveryActualDate: string | null; // Actual delivery date
  pickup: string; // Original pickup date
  pickupActualDate: string | null; // Actual pickup date
  tradeParty: string;
  grossWeight: number;
  volumeTeu: number;
  containers: number;
  costUsd: number;
}

interface ShipmentTableProps {
  data: Shipment[];
  gridId: string;
  height?: number;
}

const getStatusColor = (status: string | null | undefined) => {
  if (!status) return "bg-warning/10 text-warning hover:bg-warning/20";
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

// Helper function to parse date from DD/MM/YYYY format
const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

// Helper function to calculate delay in days
const calculateDelay = (originalDate: string | null | undefined, actualDate: string | null | undefined): number | null => {
  if (!originalDate || !actualDate) return null;
  const original = parseDate(originalDate);
  const actual = parseDate(actualDate);
  if (!original || !actual) return null;
  const diffTime = actual.getTime() - original.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Custom Delay Cell Renderer
const DelayCellRenderer = (props: any) => {
  const data = props.data || {};
  // Determine which fields to use based on the column's parent group
  const parentGroup = props.column?.getParent();
  const groupHeaderName = parentGroup?.getColGroupDef()?.headerName || '';
  const isPickup = groupHeaderName === 'PICKUP';
  const originalDate = isPickup ? data.pickup : data.delivery;
  const actualDate = isPickup ? data.pickupActualDate : data.deliveryActualDate;
  
  const delay = calculateDelay(originalDate, actualDate);
  
  if (delay === null) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  if (delay === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>0</span>
      </div>
    );
  }
  
  return (
    <span className="text-red-600 font-semibold">{delay} days</span>
  );
};


const ShipmentTable = ({ data, gridId, height = 520 }: ShipmentTableProps) => {
  const gridRef = useRef<AgGridReact<Shipment>>(null);
  const apiRef = useRef<GridApi<Shipment> | null>(null);
  const columnApiRef = useRef<any>(null);
  const popupParent = typeof document !== 'undefined' ? document.body : undefined;

  // Column Definitions with all features
  const columnDefs: ColDef<Shipment>[] = useMemo(() => [
    {
      headerName: 'OUR REFERENCE',
      field: 'id',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: 'left',
      minWidth: 150,
      flex: 0,
      width: 190,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      wrapText: true,
    },
    {
      headerName: 'STATUS',
      field: 'status',
      cellRenderer: StatusCellRenderer,
      minWidth: 150,
      flex: 0,
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'ORIGIN',
      field: 'origin',
      minWidth: 100,
      flex: 0,
      width: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'ROUTE',
      field: 'route',
      minWidth: 180,
      flex: 1,
      width: 220,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'MODE',
      field: 'transportMode',
      minWidth: 100,
      flex: 0,
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'DEPARTURE',
      field: 'departure',
      minWidth: 120,
      flex: 0,
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'ARRIVAL',
      field: 'arrival',
      minWidth: 120,
      flex: 0,
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      wrapText: true,
    },
    {
      headerName: 'PICKUP',
      children: [
        {
          headerName: 'Actual Date',
          field: 'pickupActualDate',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
          valueGetter: (params: any) => params.data?.pickupActualDate || '-',
        },
        {
          headerName: 'Delay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          valueGetter: (params: any) => {
            const delay = calculateDelay(params.data?.pickup, params.data?.pickupActualDate);
            return delay !== null ? delay : -1;
          },
          comparator: (valueA: number, valueB: number) => {
            if (valueA === -1) return 1;
            if (valueB === -1) return -1;
            return valueA - valueB;
          },
        },
      ],
    },
    {
      headerName: 'DELIVERY',
      children: [
        {
          headerName: 'Actual Date',
          field: 'deliveryActualDate',
          minWidth: 120,
          flex: 0,
          width: 140,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          sortable: true,
          resizable: true,
          enableRowGroup: true,
          enablePivot: true,
          wrapText: true,
          valueGetter: (params: any) => params.data?.deliveryActualDate || '-',
        },
        {
          headerName: 'Delay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          valueGetter: (params: any) => {
            const delay = calculateDelay(params.data?.delivery, params.data?.deliveryActualDate);
            return delay !== null ? delay : -1;
          },
          comparator: (valueA: number, valueB: number) => {
            if (valueA === -1) return 1;
            if (valueB === -1) return -1;
            return valueA - valueB;
          },
        },
      ],
    },
    {
      headerName: 'TRADE PARTY',
      field: 'tradeParty',
      minWidth: 150,
      flex: 1,
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: false,
      wrapText: true,
    },
    {
      headerName: 'GROSS WEIGHT (kg)',
      field: 'grossWeight',
      minWidth: 140,
      flex: 0,
      width: 180,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
      wrapText: true,
    },
    {
      headerName: 'VOLUME (TEU)',
      field: 'volumeTeu',
      minWidth: 120,
      flex: 0,
      width: 160,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
      wrapText: true,
    },
    {
      headerName: 'CONTAINERS',
      field: 'containers',
      minWidth: 110,
      flex: 0,
      width: 140,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
      wrapText: true,
    },
    {
      headerName: 'EST. COST (USD)',
      field: 'costUsd',
      minWidth: 150,
      flex: 0,
      width: 170,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => {
        if (value == null || value === undefined) return '';
        return `$${Number(value).toLocaleString()}`;
      },
      enableValue: true,
      wrapText: true,
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
    enableRowGroup: true,
    enableValue: true,
    enablePivot: true,
    wrapText: true,
    autoHeight: false,
    cellStyle: { 
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
  }), []);

  const autoGroupColumnDef = useMemo<ColDef>(() => ({
    headerName: 'Group',
    minWidth: 220,
    pinned: 'left',
  }), []);

  // Grid Ready Event
  const onGridReady = useCallback((params: GridReadyEvent) => {
    apiRef.current = params.api;
    columnApiRef.current = (params as any).columnApi;
    // Auto-size all columns to fit content
    params.api.sizeColumnsToFit();
    // Auto-size columns based on content after a short delay to ensure data is rendered
    setTimeout(() => {
      const allColumnIds = params.api.getColumns()?.map(col => col.getColId()).filter(Boolean) || [];
      if (allColumnIds.length > 0) {
        params.api.autoSizeColumns(allColumnIds, false);
      }
    }, 100);
  }, []);

  // Export to CSV
  const onExportCSV = useCallback(() => {
    apiRef.current?.exportDataAsCsv({
      fileName: 'shipments-export.csv',
    });
  }, []);

  // Export to Excel (Enterprise)
  const onExportExcel = useCallback(() => {
    apiRef.current?.exportDataAsExcel({
      fileName: 'shipments-export.xlsx',
    });
  }, []);

  // Clear Filters
  const onClearFilters = useCallback(() => {
    apiRef.current?.setFilterModel(null);
    columnApiRef.current?.resetColumnState();
  }, []);

  const onResetColumns = useCallback(() => {
    if (apiRef.current) {
      // Reset column state (order, width, visibility, pinned, etc.)
      apiRef.current.resetColumnState();
      // Clear all filters
      apiRef.current.setFilterModel(null);
      // Clear sorting
      apiRef.current.applyColumnState({
        defaultState: { sort: null },
        applyOrder: false,
      });
      // Clear row grouping
      apiRef.current.setRowGroupColumns([]);
      // Clear pivot
      apiRef.current.setPivotColumns([]);
      // Refresh the grid
      apiRef.current.refreshClientSideRowModel();
      // Auto-size columns to fit content
      setTimeout(() => {
        const allColumnIds = apiRef.current?.getColumns()?.map(col => col.getColId()).filter(Boolean) || [];
        if (allColumnIds.length > 0 && apiRef.current) {
          apiRef.current.autoSizeColumns(allColumnIds, false);
        }
      }, 100);
    }
  }, []);

  const onCreateChart = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const displayedRowCount = api.getDisplayedRowCount();
    if (displayedRowCount === 0) return;

    const selectedRows = api.getSelectedRows();
    const rowCount = selectedRows.length > 0 ? selectedRows.length : displayedRowCount;

    api.createRangeChart({
      cellRange: {
        rowStartIndex: 0,
        rowEndIndex: Math.min(rowCount - 1, 10),
        columns: ['grossWeight', 'volumeTeu', 'containers', 'costUsd'],
      },
      chartType: 'groupedColumn',
      chartThemeName: 'ag-vivid',
      aggFunc: 'sum',
      chartContainer: document.body,
    });
  }, []);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onExportCSV} className="gap-2">
              <FileText className="h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          onClick={onClearFilters} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
        <Button 
          onClick={onResetColumns} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset View
        </Button>
        <Button 
          onClick={onCreateChart} 
          variant="default" 
          size="sm"
          className="gap-2"
        >
          <BarChart2 className="h-4 w-4" />
          Generate Chart
        </Button>
      </div>

      {/* AG Grid Table */}
      <div
        id={gridId}
        className="ag-theme-quartz rounded-lg border border-border overflow-hidden"
        style={{ height, width: '100%' }}
      >
        <AgGridReact<Shipment>
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          theme={themeQuartz}
          rowSelection="multiple"
          animateRows={true}
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50, 100]}
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
          enableCharts
          enableRangeSelection
          sideBar={{
            toolPanels: [
              {
                id: 'columns',
                labelKey: 'columns',
                labelDefault: 'Columns',
                iconKey: 'columns',
                toolPanel: 'agColumnsToolPanel',
              },
              {
                id: 'filters',
                labelKey: 'filters',
                labelDefault: 'Filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
              },
              {
                id: 'charts',
                labelKey: 'charts',
                labelDefault: 'Charts',
                iconKey: 'menu',
                toolPanel: 'agChartsToolPanel',
              },
            ],
            defaultToolPanel: 'columns',
            hiddenByDefault: false,
          }}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalRowCountComponent', align: 'left' },
              { statusPanel: 'agFilteredRowCountComponent' },
              { statusPanel: 'agTotalAndFilteredRowCountComponent' },
              { statusPanel: 'agAggregationComponent' },
            ],
          }}
          autoGroupColumnDef={autoGroupColumnDef}
          rowGroupPanelShow="always"
          pivotPanelShow="always"
          suppressAggFuncInHeader={false}
          groupDisplayType="multipleColumns"
          chartThemes={['ag-default', 'ag-material', 'ag-sheets', 'ag-vivid']}
          cacheQuickFilter
          groupMaintainOrder
          popupParent={popupParent}
        />
      </div>
    </div>
  );
};

export default ShipmentTable;
