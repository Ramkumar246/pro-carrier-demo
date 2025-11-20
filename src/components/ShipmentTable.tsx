import { useRef, useMemo, useCallback, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";
import { Download, Filter, BarChart2, RefreshCw, ChevronDown, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";
import type { Shipment } from "@/types/shipment";
import type { DelayStage } from "@/lib/delay-utils";
import { getStageDelay } from "@/lib/delay-utils";

type DelayChartDatum = {
  tradeParty: string;
  pickup: number;
  departure: number;
  arrival: number;
  delivery: number;
};

type DelayAggregationEntry = { tradeParty: string; count: number } & Record<DelayStage, number>;

const DELAY_STAGES: DelayStage[] = ["pickup", "departure", "arrival", "delivery"];
const STAGE_LABEL: Record<DelayStage, string> = {
  pickup: "Pickup Delay",
  departure: "Departure Delay",
  arrival: "Arrival Delay",
  delivery: "Delivery Delay",
};
const STAGE_COLOR: Record<DelayStage, string> = {
  pickup: "hsl(var(--chart-1))",
  departure: "hsl(var(--chart-2))",
  arrival: "hsl(var(--chart-3))",
  delivery: "hsl(var(--chart-4))",
};

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

// Custom Delay Cell Renderer
const DelayCellRenderer = (props: any) => {
  const data = props.data || {};
  const stage: DelayStage | undefined = props.stage || props?.colDef?.cellRendererParams?.stage;
  const delay = stage ? getStageDelay(stage, data) : null;
  
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

const DelayStackedChart = ({ data }: { data: DelayChartDatum[] }) => {
  if (!data.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No delay data available for the current grid selection or filters.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Delay by Trade Party</h3>
        <p className="text-sm text-muted-foreground">
          Displays the average delay (in days) for each shipment milestone, grouped by trade party.
        </p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, bottom: 8, left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="tradeParty"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              label={{ value: "Delay (days)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number, name: string) => [`${value.toFixed(2)} days`, name]}
            />
            <Legend />
            <Bar dataKey="pickup" stackId="delay" fill={STAGE_COLOR.pickup} name={STAGE_LABEL.pickup} />
            <Bar dataKey="departure" stackId="delay" fill={STAGE_COLOR.departure} name={STAGE_LABEL.departure} />
            <Bar dataKey="arrival" stackId="delay" fill={STAGE_COLOR.arrival} name={STAGE_LABEL.arrival} />
            <Bar dataKey="delivery" stackId="delay" fill={STAGE_COLOR.delivery} name={STAGE_LABEL.delivery} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const ShipmentTable = ({ data, gridId, height = 520 }: ShipmentTableProps) => {
  const gridRef = useRef<AgGridReact<Shipment>>(null);
  const apiRef = useRef<GridApi<Shipment> | null>(null);
  const columnApiRef = useRef<any>(null);
  const popupParent = typeof document !== 'undefined' ? document.body : undefined;
  const [chartMode, setChartMode] = useState<"performance" | "delay">("performance");
  const [delayChartData, setDelayChartData] = useState<DelayChartDatum[] | null>(null);

  const buildDelayChartData = useCallback((): DelayChartDatum[] => {
    const api = apiRef.current;
    if (!api) return [];

    const aggregation = new Map<string, DelayAggregationEntry>();

    api.forEachNodeAfterFilterAndSort((node) => {
      const row = node.data;
      if (!row) return;
      const tradeParty = row.tradeParty || "Unknown";
      if (!aggregation.has(tradeParty)) {
        aggregation.set(tradeParty, {
          tradeParty,
          count: 0,
          pickup: 0,
          departure: 0,
          arrival: 0,
          delivery: 0,
        });
      }
      const entry = aggregation.get(tradeParty)!;
      DELAY_STAGES.forEach((stage) => {
        const delayValue = getStageDelay(stage, row) ?? 0;
        entry[stage] += delayValue;
      });
      entry.count += 1;
    });

    return Array.from(aggregation.values()).map((entry) => ({
      tradeParty: entry.tradeParty,
      pickup: entry.count ? Number((entry.pickup / entry.count).toFixed(2)) : 0,
      departure: entry.count ? Number((entry.departure / entry.count).toFixed(2)) : 0,
      arrival: entry.count ? Number((entry.arrival / entry.count).toFixed(2)) : 0,
      delivery: entry.count ? Number((entry.delivery / entry.count).toFixed(2)) : 0,
    }));
  }, []);

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
      children: [
        {
          headerName: 'ETD',
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
          headerName: 'ATD',
          field: 'departureActualDate',
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
          valueGetter: (params) => params.data?.departureActualDate || '-',
        },
        {
          headerName: 'Delay',
          colId: 'departureDelay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          cellRendererParams: { stage: 'departure' },
          valueGetter: (params) => {
            const delay = getStageDelay('departure', params.data);
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
      headerName: 'ARRIVAL',
      children: [
        {
          headerName: 'ETA',
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
          headerName: 'ATA',
          field: 'arrivalActualDate',
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
          valueGetter: (params) => params.data?.arrivalActualDate || '-',
        },
        {
          headerName: 'Delay',
          colId: 'arrivalDelay',
          minWidth: 100,
          flex: 0,
          width: 120,
          sortable: true,
          resizable: true,
          cellRenderer: DelayCellRenderer,
          cellRendererParams: { stage: 'arrival' },
          valueGetter: (params) => {
            const delay = getStageDelay('arrival', params.data);
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
          cellRendererParams: { stage: 'pickup' },
          valueGetter: (params: any) => {
            const delay = getStageDelay('pickup', params.data);
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
          cellRendererParams: { stage: 'delivery' },
          valueGetter: (params: any) => {
            const delay = getStageDelay('delivery', params.data);
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

  const onGenerateChart = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    if (chartMode === "performance") {
      setDelayChartData(null);
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
      return;
    }

    const chartData = buildDelayChartData();
    setDelayChartData(chartData);
  }, [chartMode, buildDelayChartData]);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value={chartMode}
            onValueChange={(value) => setChartMode(value as "performance" | "delay")}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select chart mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Operations Metrics (default)</SelectItem>
              <SelectItem value="delay">Delay by Trade Party</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={onGenerateChart} 
            variant="default" 
            size="sm"
            className="gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            Generate Chart
          </Button>
        </div>
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
      {delayChartData && chartMode === "delay" && (
        <DelayStackedChart data={delayChartData} />
      )}
    </div>
  );
};

export default ShipmentTable;
