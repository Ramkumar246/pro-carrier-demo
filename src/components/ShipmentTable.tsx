import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";
import {
  AllEnterpriseModule,
  IntegratedChartsModule,
  LicenseManager,
} from "ag-grid-enterprise";
import type {
  ColDef,
  GridReadyEvent,
  GridApi,
  RowClickedEvent,
} from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import type { Shipment } from "@/types/shipment";

ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule,
  IntegratedChartsModule,
]);

LicenseManager.setLicenseKey(
  import.meta.env?.VITE_AG_GRID_LICENSE_KEY ??
    "This is a development-only AG Grid Enterprise evaluation. Replace with your license key.",
);

interface ShipmentTableProps {
  data: Shipment[];
  gridId: string;
  height?: number;
  activeFilter?: "All" | "Sea" | "Air" | "Road";
}

const getStatusColor = (status: string | null | undefined) => {
  if (!status) return "bg-warning/10 text-warning hover:bg-warning/20";
  if (status.includes("Delivery"))
    return "bg-success/10 text-success hover:bg-success/20";
  if (status.includes("Arrival"))
    return "bg-info/10 text-info hover:bg-info/20";
  return "bg-warning/10 text-warning hover:bg-warning/20";
};

const StatusCellRenderer = (props: any) => {
  return (
    <Badge variant="secondary" className={getStatusColor(props.value)}>
      {props.value}
    </Badge>
  );
};

const ShipmentTable = ({ data, gridId, height = 520 }: ShipmentTableProps) => {
  const gridRef = useRef<AgGridReact<Shipment>>(null);
  const apiRef = useRef<GridApi<Shipment> | null>(null);
  const columnApiRef = useRef<any>(null);
  const popupParent =
    typeof document !== "undefined" ? document.body : undefined;
  const navigate = useNavigate();

  const columnDefs: ColDef<Shipment>[] = useMemo(
    () => [
      {
        headerName: "OUR REFERENCE",
        field: "id",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        pinned: "left",
        minWidth: 150,
        flex: 0,
        width: 190,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        wrapText: true,
      },
      {
        headerName: "STATUS",
        field: "status",
        cellRenderer: StatusCellRenderer,
        minWidth: 150,
        flex: 0,
        width: 200,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "ORIGIN",
        field: "origin",
        minWidth: 100,
        flex: 0,
        width: 120,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "ROUTE",
        field: "route",
        minWidth: 180,
        flex: 1,
        width: 220,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "MODE",
        field: "transportMode",
        minWidth: 100,
        flex: 0,
        width: 140,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "CONTAINER MODE",
        field: "containerMode",
        minWidth: 130,
        flex: 0,
        width: 150,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "ETD",
        field: "departure",
        minWidth: 120,
        flex: 0,
        width: 140,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "ETA",
        field: "arrival",
        minWidth: 120,
        flex: 0,
        width: 140,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "TRADE PARTY",
        field: "tradeParty",
        minWidth: 150,
        flex: 1,
        width: 200,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        wrapText: true,
      },
      {
        headerName: "GROSS WEIGHT (kg)",
        field: "grossWeight",
        minWidth: 140,
        flex: 0,
        width: 180,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableValue: true,
        wrapText: true,
      },
      {
        headerName: "VOLUME (TEU)",
        field: "volumeTeu",
        minWidth: 120,
        flex: 0,
        width: 160,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableValue: true,
        wrapText: true,
      },
      {
        headerName: "CONTAINERS",
        field: "containers",
        minWidth: 110,
        flex: 0,
        width: 140,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        enableValue: true,
        wrapText: true,
      },
      {
        headerName: "EST. COST (USD)",
        field: "costUsd",
        minWidth: 150,
        flex: 0,
        width: 170,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        sortable: true,
        resizable: true,
        valueFormatter: ({ value }) => {
          if (value == null || value === undefined) return "";
          return `$${Number(value).toLocaleString()}`;
        },
        enableValue: true,
        wrapText: true,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
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
        display: "flex",
        alignItems: "center",
        whiteSpace: "normal",
        wordBreak: "break-word",
      },
    }),
    [],
  );

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      apiRef.current = params.api;
      columnApiRef.current = (params as any).columnApi;
      params.api.sizeColumnsToFit();
      setTimeout(() => {
        const allColumnIds =
          params.api
            .getColumns()
            ?.map((col) => col.getColId())
            .filter(Boolean) || [];
        if (allColumnIds.length > 0) {
          params.api.autoSizeColumns(allColumnIds, false);
        }
      }, 100);
    },
    [],
  );

  const onExportCSV = useCallback(() => {
    apiRef.current?.exportDataAsCsv({ fileName: "shipments-export.csv" });
  }, []);

  const onExportExcel = useCallback(() => {
    apiRef.current?.exportDataAsExcel({ fileName: "shipments-export.xlsx" });
  }, []);

  const onClearFilters = useCallback(() => {
    apiRef.current?.setFilterModel(null);
    columnApiRef.current?.resetColumnState();
  }, []);

  const onResetColumns = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.resetColumnState();
    apiRef.current.setFilterModel(null);
    apiRef.current.applyColumnState({
      defaultState: { sort: null },
      applyOrder: false,
    });
    apiRef.current.setRowGroupColumns([]);
    apiRef.current.setPivotColumns([]);
    apiRef.current.refreshClientSideRowModel();
    setTimeout(() => {
      const allColumnIds =
        apiRef.current
          ?.getColumns()
          ?.map((col) => col.getColId())
          .filter(Boolean) || [];
      if (allColumnIds.length > 0 && apiRef.current) {
        apiRef.current.autoSizeColumns(allColumnIds, false);
      }
    }, 100);
  }, []);

  const onRowClicked = useCallback(
    (event: RowClickedEvent<Shipment>) => {
      const shipment = event.data;
      if (!shipment) return;
      if (
        shipment.transportMode === "Sea" ||
        shipment.transportMode === "Air" ||
        shipment.transportMode === "Road"
      ) {
        navigate("/external-page", {
          state: {
            transportMode: shipment.transportMode,
            shipment,
          },
        });
      }
    },
    [navigate],
  );

  useEffect(() => {
    // Re-render charts or any derived data when table data changes in future
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
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
      </div>

      <div
        id={gridId}
        className="ag-theme-quartz rounded-lg border border-border overflow-hidden"
        style={{ height, width: "100%" }}
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
          domLayout="normal"
          suppressContextMenu={false}
          allowContextMenuWithControlKey={true}
          getContextMenuItems={() => [
            "copy",
            "copyWithHeaders",
            "separator",
            "export",
          ]}
          enableCharts
          enableRangeSelection={true}
          suppressRowClickSelection={false}
          popupParent={popupParent}
          onRowClicked={onRowClicked}
        />
      </div>
    </div>
  );
};

export default ShipmentTable;
