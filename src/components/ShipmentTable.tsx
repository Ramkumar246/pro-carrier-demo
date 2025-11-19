import { useRef, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AllEnterpriseModule, IntegratedChartsModule, LicenseManager } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import type { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Filter, Eye, BarChart2, RefreshCw } from "lucide-react";

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

export interface Shipment {
  id: string;
  status: string;
  origin: string;
  route: string;
  departure: string;
  arrival: string;
  delivery: string;
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
      width: 190,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
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
      enableRowGroup: true,
      enablePivot: true,
    },
    {
      headerName: 'ORIGIN',
      field: 'origin',
      width: 120,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
    },
    {
      headerName: 'ROUTE',
      field: 'route',
      width: 220,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
    },
    {
      headerName: 'DEPARTURE',
      field: 'departure',
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
    },
    {
      headerName: 'ARRIVAL',
      field: 'arrival',
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
    },
    {
      headerName: 'DELIVERY',
      field: 'delivery',
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: false,
    },
    {
      headerName: 'TRADE PARTY',
      field: 'tradeParty',
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: false,
    },
    {
      headerName: 'GROSS WEIGHT (kg)',
      field: 'grossWeight',
      width: 180,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
    },
    {
      headerName: 'VOLUME (TEU)',
      field: 'volumeTeu',
      width: 160,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
    },
    {
      headerName: 'CONTAINERS',
      field: 'containers',
      width: 140,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      enableValue: true,
    },
    {
      headerName: 'EST. COST (USD)',
      field: 'costUsd',
      width: 170,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      resizable: true,
      valueFormatter: ({ value }) => `$${value.toLocaleString()}`,
      enableValue: true,
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
    enableRowGroup: true,
    enableValue: true,
    enablePivot: true,
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
    params.api.sizeColumnsToFit();
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
    columnApiRef.current?.resetColumnState();
    apiRef.current?.refreshClientSideRowModel('aggregate');
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
        <Button 
          onClick={onExportExcel} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Excel
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
          theme="legacy"
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
