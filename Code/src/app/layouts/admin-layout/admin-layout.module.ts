import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule,FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { IndexComponent } from '../../index/index.component';
import { PortalAccessComponent } from '../../portal-access/portal-access.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { ChartsModule } from 'ng2-charts';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { WardMonitoringComponent } from '../../reports/ward-monitoring/ward-monitoring.component';
import { SkipLineComponent } from '../../reports/skip-line/skip-line.component';
import { HaltsComponent } from '../../reports/halts/halts.component';
import { LoginComponent } from '../../login/login.component';
import { LogoutComponent } from '../../logout/logout.component';
import { HouseEntryFormComponent } from '../../house-entry-form/house-entry-form.component';
import { DownloadCollectionReportComponent } from '../../reports/download-collection-report/download-collection-report.component';
import { HouseSearchComponent } from '../../housesearch/housesearch.component';
import { SignupComponent } from '../../signup/signup.component';
import { FleetMonitorComponent } from '../../fleet-monitor/fleet-monitor.component';
import { LineStatisticsComponent } from '../../line-statistics/line-statistics.component';
import { LineCardMappingComponent } from '../../line-card-mapping/line-card-mapping.component';
import { TimeDistanceComponent } from '../../reports/time-distance/time-distance.component';
import { RealtimeMonitoringComponent } from '../../realtime-monitoring/realtime-monitoring.component';
import { DustbinMonitoringComponent } from '../../dustbin-monitoring/dustbin-monitoring.component';
import { DownloadWardwiseReportComponent } from '../../reports/download-wardwise-report/download-wardwise-report.component';
import {UserListComponent} from "../../Users/user-list/user-list.component";
import {UserAccessComponent} from "../../Users/user-access/user-access.component";
import {UserAddComponent} from "../../Users/user-add/user-add.component";
import { HomeComponent } from '../../home/home.component';
import { HaltReportComponent } from '../../halt-report/halt-report.component';
import { OrderByPipe } from '../../order-by.pipe';
import { RouteTrackingComponent } from '../../route-tracking/route-tracking.component';
import { HaltSummaryComponent } from '../../halt-summary/halt-summary.component';
import { SalarySummaryComponent } from '../../salary-summary/salary-summary.component';
import { WardMonitoringReportComponent } from '../../ward-monitoring-report/ward-monitoring-report.component';
import { FinanceComponent } from '../../finance-report/finance/finance.component';
import { WardReachCostComponent } from '../../finance-report/ward-reach-cost/ward-reach-cost.component';
import { MonthSalaryReportComponent } from '../../finance-report/month-salary-report/month-salary-report.component';
import { ReportsComponent } from '../../reports/reports/reports.component';
import { RemarkReportComponent } from '../../reports/remark-report/remark-report.component';
import { WorkAssignReportComponent } from '../../reports/work-assign-report/work-assign-report.component';
import { PortalServicesComponent } from '../../PortalServices/portal-services/portal-services.component';
import { WardDutyDataComponent } from '../../PortalServices/ward-duty-data/ward-duty-data.component';
import { DustbinAnalysisComponent } from '../../reports/dustbin-analysis/dustbin-analysis.component';
import { InventoryComponent } from '../../Inventory/inventory/inventory.component';
import { PetrolInventoryListComponent } from '../../Inventory/petrol-inventory-list/petrol-inventory-list.component';
import { PetrolInventoryEntryComponent } from '../../Inventory/petrol-inventory-entry/petrol-inventory-entry.component';
import { VehiclePetrolCostComponent } from '../../finance-report/vehicle-petrol-cost/vehicle-petrol-cost.component';
import { MaintenanceInventoryListComponent } from '../../Inventory/maintenance-inventory-list/maintenance-inventory-list.component';
import { MaintenanceInventoryEntryComponent } from '../../Inventory/maintenance-inventory-entry/maintenance-inventory-entry.component';
import { VehicleMaintenanceCostComponent } from '../../finance-report/vehicle-maintenance-cost/vehicle-maintenance-cost.component';
import { VehiclePetrolReportComponent } from '../../reports/vehicle-petrol-report/vehicle-petrol-report.component';
import { VehiclePartReportComponent } from '../../reports/vehicle-part-report/vehicle-part-report.component';
import { DustbinReportComponent } from '../../reports/dustbin-report/dustbin-report.component';
import { CmsComponent } from '../../cms/cms.component';
import { Cms1Component } from '../../cms1/cms1.component';
import { VehicleReportComponent } from '../../reports/vehicle-report/vehicle-report.component';
import { MultipleMapsComponent } from '../../multiple-maps/multiple-maps.component';
import { TaskManagerComponent } from '../../task-manager/task-manager.component';
import { WardTripAnalysisComponent } from '../../reports/ward-trip-analysis/ward-trip-analysis.component';
import { HouseMarkingComponent } from '../../house-survey/house-marking/house-marking.component';
import { TaskManagementMastersComponent } from '../../PortalServices/task-management-masters/task-management-masters.component';
import { HouseMarkingAssignmentComponent } from '../../house-survey/house-marking-assignment/house-marking-assignment.component';
import { EmployeeMarkingComponent } from '../../house-survey/employee-marking/employee-marking.component';
import { WardSurveyAnalysisComponent } from '../../house-survey/ward-survey-analysis/ward-survey-analysis.component';
import { WardSurveySummaryComponent } from '../../house-survey/ward-survey-summary/ward-survey-summary.component';
import { MapCardReviewComponent } from '../../PortalServices/map-card-review/map-card-review.component';
import { WardMarkingSummaryComponent } from '../../house-survey/ward-marking-summary/ward-marking-summary.component';
import { WardScancardReportComponent } from '../../reports/ward-scancard-report/ward-scancard-report.component';
import { LineMarkerMappingComponent } from '../../PortalServices/line-marker-mapping/line-marker-mapping.component';
import { VehicleAssignedComponent } from '../../reports/vehicle-assigned/vehicle-assigned.component';
import { LogBookComponent } from '../../reports/log-book/log-book.component';
import { WardScancardSummaryComponent } from '../../reports/ward-scancard-summary/ward-scancard-summary.component';
import { GarbageCaptureAnalysisComponent } from '../../VTS/garbage-capture-analysis/garbage-capture-analysis.component';
import { VtsReportComponent } from '../../VTS/vts-report/vts-report.component';
import { VtsMonthlyReportComponent } from '../../finance-report/vts-monthly-report/vts-monthly-report.component';
import { ChangePasswordComponent } from '../../change-password/change-password.component';
import { VtsRouteComponent } from '../../VTS/vts-route/vts-route.component';
import { CreateRoutesComponent } from '../../VTS/create-routes/create-routes.component';
import { UploadRouteExcelComponent } from '../../VTS/upload-route-excel/upload-route-excel.component';
import { BvgRoutesComponent } from '../../VTS/bvg-routes/bvg-routes.component';
import { VtsAnalysisComponent } from '../../VTS/vts-analysis/vts-analysis.component';
import { PenaltySummaryComponent } from '../../VTS/penalty-summary/penalty-summary.component';
import { FieldExecutiveTrackingComponent } from '../../field-executive-tracking/field-executive-tracking.component';
import { ShowRouteComponent } from '../../VTS/show-route/show-route.component';
import { FieldExecutiveAttendanceComponent } from '../../reports/field-executive-attendance/field-executive-attendance.component';
import { VehicleFuelReportComponent } from '../../reports/vehicle-fuel-report/vehicle-fuel-report.component';
import { EmployeePenaltyComponent } from '../../finance-report/employee-penalty/employee-penalty.component';
import { PenaltyPortalServiceComponent } from '../../PortalServices/penalty-portal-service/penalty-portal-service.component';
import { AccountDetailComponent } from '../../salary-management/account-detail/account-detail.component';
import { EmployeeSalaryComponent } from '../../salary-management/employee-salary/employee-salary.component';
import { SalaryHoldingManagementComponent } from '../../salary-management/salary-holding-management/salary-holding-management.component';
import { FeDailyWorkReportComponent } from '../../reports/fe-daily-work-report/fe-daily-work-report.component';
import { KmlToJsonComponent } from '../../PortalServices/kml-to-json/kml-to-json.component';
import { SalaryTransactionComponent } from '../../salary-management/salary-transaction/salary-transaction.component';
import { DustbinServiceComponent } from '../../PortalServices/dustbin-service/dustbin-service.component';
import { WardWorkTrackingComponent } from '../../ward-work-tracking/ward-work-tracking.component';
import { StaffAccountDetailComponent } from '../../salary-management/staff-account-detail/staff-account-detail.component';
import { CashManagementComponent } from '../../expense-management/cash-management/cash-management.component';
import { WardWorkPercentageComponent } from '../../PortalServices/ward-work-percentage/ward-work-percentage.component';
import { ChangeLineSurveyedDataComponent } from '../../PortalServices/change-line-surveyed-data/change-line-surveyed-data.component';
import { WardWorkDoneComponent } from '../../reports/ward-work-done/ward-work-done.component';
import { SettingsComponent } from '../../PortalServices/settings/settings.component';
import { VendorLedgerComponent } from '../../expense-management/vendor-ledger/vendor-ledger.component';
import { EmployeesComponent } from '../../PortalServices/employees/employees.component';
import { SpecialUsersComponent } from '../../PortalServices/special-users/special-users.component';
import { DustbinPlaningComponent } from '../../Dustbin/dustbin-planing/dustbin-planing.component';
import { DustbinWardMappingComponent } from '../../PortalServices/dustbin-ward-mapping/dustbin-ward-mapping.component';
import { LineWeightageComponent } from '../../PortalServices/line-weightage/line-weightage.component';
import { DustbinManageComponent } from '../../PortalServices/dustbin-manage/dustbin-manage.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    ChartsModule,
    NgbModule,
    ToastrModule.forRoot()
  ],
  declarations: [
    IndexComponent,
    PortalAccessComponent,
    DashboardComponent,
    MapsComponent,
    NotificationsComponent,
    WardMonitoringComponent,
    SkipLineComponent,
    HaltsComponent,
    LoginComponent,
    LogoutComponent,
    HouseEntryFormComponent,
    DownloadCollectionReportComponent,
    HouseSearchComponent,
    SignupComponent,
    FleetMonitorComponent,
    LineStatisticsComponent,
    LineCardMappingComponent,
    TimeDistanceComponent,
    RealtimeMonitoringComponent,
    DustbinMonitoringComponent,
    DownloadWardwiseReportComponent,
    UserListComponent,
    UserAddComponent,
    UserAccessComponent,
    HomeComponent,
    OrderByPipe,
    HaltReportComponent,
    RouteTrackingComponent,
    HaltSummaryComponent,
    SalarySummaryComponent,
    WardMonitoringReportComponent,
    FinanceComponent,
    WardReachCostComponent,
    MonthSalaryReportComponent,
    ReportsComponent,
    RemarkReportComponent,
    WorkAssignReportComponent,
    PortalServicesComponent,
    WardDutyDataComponent,
    DustbinAnalysisComponent,
    InventoryComponent,
    PetrolInventoryListComponent,
    PetrolInventoryEntryComponent,
    VehiclePetrolCostComponent,
    MaintenanceInventoryListComponent,
    MaintenanceInventoryEntryComponent,
    VehicleMaintenanceCostComponent,
    VehiclePetrolReportComponent,
    VehiclePartReportComponent,
    DustbinReportComponent,
    CmsComponent,
    Cms1Component,
    VehicleReportComponent,
    MultipleMapsComponent,
    TaskManagerComponent,
    WardTripAnalysisComponent,
    HouseMarkingComponent,
    TaskManagementMastersComponent,
    HouseMarkingAssignmentComponent,
    EmployeeMarkingComponent,
    WardSurveyAnalysisComponent,
    WardSurveySummaryComponent,
    MapCardReviewComponent,
    WardMarkingSummaryComponent,
    WardScancardReportComponent,
    LineMarkerMappingComponent,
    VehicleAssignedComponent,
    LogBookComponent,
    WardScancardSummaryComponent,
    GarbageCaptureAnalysisComponent,
    VtsReportComponent,
    VtsMonthlyReportComponent,
    ChangePasswordComponent,
    VtsRouteComponent,
    CreateRoutesComponent,
    UploadRouteExcelComponent,
    BvgRoutesComponent,
    VtsAnalysisComponent,
    PenaltySummaryComponent,
    FieldExecutiveTrackingComponent,
    ShowRouteComponent,
    FieldExecutiveAttendanceComponent,
    VehicleFuelReportComponent,
    EmployeePenaltyComponent,
    PenaltyPortalServiceComponent,
    AccountDetailComponent,
    EmployeeSalaryComponent,
    SalaryHoldingManagementComponent,
    FeDailyWorkReportComponent,
    KmlToJsonComponent,
    SalaryTransactionComponent,
    DustbinServiceComponent,
    WardWorkTrackingComponent,
    StaffAccountDetailComponent,
    CashManagementComponent,
    WardWorkPercentageComponent,
    ChangeLineSurveyedDataComponent,
    WardWorkDoneComponent,
    SettingsComponent,
    VendorLedgerComponent,
    EmployeesComponent,
    SpecialUsersComponent,
    DustbinPlaningComponent,
    DustbinWardMappingComponent,
    LineWeightageComponent,
    DustbinManageComponent
  ]
})

export class AdminLayoutModule { 

}
