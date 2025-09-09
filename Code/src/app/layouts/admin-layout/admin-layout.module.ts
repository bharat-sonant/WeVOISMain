import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule,FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { AdminLayoutRoutes } from './admin-layout.routing';
import { IndexComponent } from '../../index/index.component';
import { PortalAccessComponent } from '../../portal-access/portal-access.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
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
import { FleetMonitorComponent } from '../../fleet-monitor/fleet-monitor.component';
import { LineStatisticsComponent } from '../../line-statistics/line-statistics.component';
import { LineCardMappingComponent } from '../../house-survey/line-card-mapping/line-card-mapping.component';
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
import { DustbinReportComponent } from '../../reports/dustbin-report/dustbin-report.component';
import { CmsComponent } from '../../cms/cms.component';
import { Cms1Component } from '../../cms1/cms1.component';
import { VehicleReportComponent } from '../../reports/vehicle-report/vehicle-report.component';
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
import { LineMarkerMappingComponent } from '../../house-survey/line-marker-mapping/line-marker-mapping.component';
import { VehicleAssignedComponent } from '../../reports/vehicle-assigned/vehicle-assigned.component';
import { LogBookComponent } from '../../reports/log-book/log-book.component';
import { WardScancardSummaryComponent } from '../../reports/ward-scancard-summary/ward-scancard-summary.component';
import { ChangePasswordComponent } from '../../change-password/change-password.component';
import { VehicleFuelReportComponent } from '../../reports/vehicle-fuel-report/vehicle-fuel-report.component';
import { EmployeePenaltyComponent } from '../../finance-report/employee-penalty/employee-penalty.component';
import { PenaltyPortalServiceComponent } from '../../PortalServices/penalty-portal-service/penalty-portal-service.component';
import { AccountDetailComponent } from '../../salary-management/account-detail/account-detail.component';
import { EmployeeSalaryComponent } from '../../salary-management/employee-salary/employee-salary.component';
import { SalaryHoldingManagementComponent } from '../../salary-management/salary-holding-management/salary-holding-management.component';
import { KmlToJsonComponent } from '../../PortalServices/kml-to-json/kml-to-json.component';
import { SalaryTransactionComponent } from '../../salary-management/salary-transaction/salary-transaction.component';
import { DustbinServiceComponent } from '../../Dustbin/dustbin-service/dustbin-service.component';
import { WardWorkTrackingComponent } from '../../ward-work-tracking/ward-work-tracking.component';
import { StaffAccountDetailComponent } from '../../salary-management/staff-account-detail/staff-account-detail.component';
import { WardWorkPercentageComponent } from '../../PortalServices/ward-work-percentage/ward-work-percentage.component';
import { ChangeLineSurveyedDataComponent } from '../../PortalServices/change-line-surveyed-data/change-line-surveyed-data.component';
import { WardWorkDoneComponent } from '../../reports/ward-work-done/ward-work-done.component';
import { SettingsComponent } from '../../PortalServices/settings/settings.component';
import { EmployeesComponent } from '../../EmployeeManagement/employees/employees.component';
import { SpecialUsersComponent } from '../../EmployeeManagement/special-users/special-users.component';
import { DustbinPlaningComponent } from '../../Dustbin/dustbin-planing/dustbin-planing.component';
import { DustbinWardMappingComponent } from '../../PortalServices/dustbin-ward-mapping/dustbin-ward-mapping.component';
import { LineWeightageComponent } from '../../PortalServices/line-weightage/line-weightage.component';
import { DustbinManageComponent } from '../../Dustbin/dustbin-manage/dustbin-manage.component';
import { RoutesTrackingComponent } from '../../routes-tracking/routes-tracking.component';
import { SalaryCalculationComponent } from '../../salary-management/salary-calculation/salary-calculation.component';
import { DailyFuelReportComponent } from '../../reports/daily-fuel-report/daily-fuel-report.component';
import { SalaryCalculationsComponent } from '../../salary-management/salary-calculations/salary-calculations.component';
import { EmployeeAttendanceComponent } from '../../EmployeeManagement/employee-attendance/employee-attendance.component';
import { MonthlyAttendanceComponent } from '../../EmployeeManagement/monthly-attendance/monthly-attendance.component';
import { DailyWorkDetailComponent } from '../../reports/daily-work-detail/daily-work-detail.component';
import { SupportQueryComponent } from '../../EmployeeManagement/support-query/support-query.component';
import { MonthlyFuelReportComponent } from '../../reports/monthly-fuel-report/monthly-fuel-report.component';
import { VehicleBreakdownComponent } from '../../VehicleMaintenance/vehicle-breakdown/vehicle-breakdown.component';
import { VehicleBreakdownReportComponent } from '../../VehicleMaintenance/vehicle-breakdown-report/vehicle-breakdown-report.component';
import { ChangeLineMarkerDataComponent } from '../../PortalServices/change-line-marker-data/change-line-marker-data.component';
import { AddVehicleBreakdownComponent } from '../../VehicleMaintenance/add-vehicle-breakdown/add-vehicle-breakdown.component';
import { RolesComponent } from '../../user-management/roles/roles.component';
import { RolePageAccessComponent } from '../../user-management/role-page-access/role-page-access.component';
import { MapsComponent } from '../../maps/maps.component';
import { CardMarkerMappingComponent } from '../../Developers/card-marker-mapping/card-marker-mapping.component';
import { ScanCardStatusComponent } from '../../house-survey/scan-card-status/scan-card-status.component';
import { ComplaintListComponent } from '../../complaint-list/complaint-list.component';
import { ScanCardManipulationComponent } from '../../PortalServices/scan-card-manipulation/scan-card-manipulation.component';
import { AddMarkerAgainstCardsComponent } from '../../Developers/add-marker-against-cards/add-marker-against-cards.component';
import { CardScanningReportComponent } from '../../reports/card-scanning-report/card-scanning-report.component';
import { SurveyVerificationComponent } from '../../house-survey/survey-verification/survey-verification.component';
import { SurveyHousesComponent } from '../../house-survey/survey-houses/survey-houses.component';
import {MarkerApprovalTestComponent} from '../../marker-approval-test/marker-approval-test.component';
import { SupervisorReportComponent } from '../../house-survey/supervisor-report/supervisor-report.component';
import { SetNearbyWardComponent } from '../../PortalServices/set-nearby-ward/set-nearby-ward.component';
import { ManageMarkingDataComponent } from '../../Developers/manage-marking-data/manage-marking-data.component';
import { WardwiseScanCardComponent } from '../../wardwise-scan-card/wardwise-scan-card.component';
import { ReviewDutyonImagesComponent } from '../../review-dutyon-images/review-dutyon-images.component';
import { ReviewTripImagesComponent } from '../../reports/review-trip-images/review-trip-images.component';
import { PaymentCollectorComponent } from '../../payment-collector/payment-collector.component';
import { DueAmountReportComponent } from '../../reports/due-amount-report/due-amount-report.component';
import { CollectedAmountReportComponent } from '../../reports/collected-amount-report/collected-amount-report.component';
import { SurveyVerifiedReportComponent } from '../../house-survey/survey-verified-report/survey-verified-report.component';
import { PaymentViaChequeComponent } from '../../reports/payment-via-cheque/payment-via-cheque.component';
import { PaymentViaChequeReportComponent } from '../../reports/payment-via-cheque-report/payment-via-cheque-report.component';
import { CardTransectionDetailComponent } from '../../reports/card-transection-detail/card-transection-detail.component';
import { CardUpdatedHistoryComponent } from '../../reports/card-updated-history/card-updated-history.component';
import { DailyPaymentReportComponent } from '../../reports/daily-payment-report/daily-payment-report.component';
import { MonthlyPaymentReportComponent } from '../../reports/monthly-payment-report/monthly-payment-report.component';
import { EntityPaymentReportComponent } from '../../reports/entity-payment-report/entity-payment-report.component';
import { WardRoadDetailComponent } from '../../house-survey/ward-road-detail/ward-road-detail.component';
import { UpdateSurveyorVirtualComponent } from '../../Developers/update-surveyor-virtual/update-surveyor-virtual.component';
import { NonSalariedCalculationComponent } from '../../salary-management/non-salaried-calculation/non-salaried-calculation.component';
import { VehicleTrackingComponent } from '../../VTS/vehicle-tracking/vehicle-tracking.component';
import { VheicleCurrentInfoComponent } from '../../VTS/vheicle-current-info/vheicle-current-info.component';
import { SetMarkerImagesComponent } from '../../Developers/set-marker-images/set-marker-images.component';
import { PaymentViaNeftComponent } from '../../reports/payment-via-neft/payment-via-neft.component';
import { PaymentViaNeftReportComponent } from '../../reports/payment-via-neft-report/payment-via-neft-report.component';
import { RemoveDeletedScancardsComponent } from '../../Developers/remove-deleted-scancards/remove-deleted-scancards.component';
import { PenaltyReviewComponent } from '../../PortalServices/penalty-review/penalty-review.component';
import { PaymentViaCitizenappComponent } from '../../reports/payment-via-citizenapp/payment-via-citizenapp.component';
import { PageLoadHistoryComponent } from '../../page-load-history/page-load-history.component';
import { DatabaseUtilizationComponent } from '../../database-utilization/database-utilization.component';
import { SecondaryCollectionMonitoringComponent } from '../../secondary-collection-monitoring/secondary-collection-monitoring.component';
import { SecondaryCollectionAnalysisComponent } from '../../secondary-collection-analysis/secondary-collection-analysis.component';
import { SecondaryCollectionPlaningComponent } from '../../secondary-collection-planing/secondary-collection-planing.component';
import { SecondaryCollectionServiceComponent } from '../../secondary-collection-service/secondary-collection-service.component';
import { SecondaryCollectionManageComponent } from '../../secondary-collection-manage/secondary-collection-manage.component';
import { EntityModificationComponent } from '../../entity-modification/entity-modification.component';
import { PaymentCollectorTrackingComponent } from '../../reports/payment-collector-tracking/payment-collector-tracking.component';
import { ErrorPageComponent } from '../../error-page/error-page.component';
import { SecondaryCollectionWardMappingComponent } from '../../PortalServices/secondary-collection-ward-mapping/secondary-collection-ward-mapping.component';
import { MonthlyWorkReportComponent } from '../../reports/monthly-work-report/monthly-work-report.component';
import { WebPortalSettingComponent } from '../../PortalServices/web-portal-setting/web-portal-setting.component';
import { WardRouteTrackingComponent } from '../../ward-route-tracking/ward-route-tracking.component';
import { WardDutyOnComponent } from '../../PortalServices/ward-duty-on/ward-duty-on.component';

// Jaipur-Greater

import { GarbageCaptureAnalysisComponent } from '../../VTS/garbage-capture-analysis/garbage-capture-analysis.component';
import { VtsReportComponent } from '../../VTS/vts-report/vts-report.component';
import { VtsMonthlyReportComponent } from '../../VTS/vts-monthly-report/vts-monthly-report.component';
import { VtsRouteComponent } from '../../VTS/vts-route/vts-route.component';
import { CreateRoutesComponent } from '../../VTS/create-routes/create-routes.component';
import { UploadRouteExcelComponent } from '../../VTS/upload-route-excel/upload-route-excel.component';
import { BvgRoutesComponent } from '../../VTS/bvg-routes/bvg-routes.component';
import { VtsAnalysisComponent } from '../../VTS/vts-analysis/vts-analysis.component';
import { PenaltySummaryComponent } from '../../VTS/penalty-summary/penalty-summary.component';
import { FieldExecutiveTrackingComponent } from '../../VTS/field-executive-tracking/field-executive-tracking.component';
import { ShowRouteComponent } from '../../VTS/show-route/show-route.component';
import { FieldExecutiveAttendanceComponent } from '../../VTS/field-executive-attendance/field-executive-attendance.component';
import { FeDailyWorkReportComponent } from '../../VTS/fe-daily-work-report/fe-daily-work-report.component';


// BI Dashboard

import { AssetsDashboardComponent } from '../../reports/assets-dashboard/assets-dashboard.component';
import { ComplaintDashboardComponent } from '../../reports/complaint-dashboard/complaint-dashboard.component';
import { FuelDashboardComponent } from '../../reports/fuel-dashboard/fuel-dashboard.component';
import { BikeFuelDashboardComponent } from '../../reports/bike-fuel-dashboard/bike-fuel-dashboard.component';
import { MonitoringDashboardComponent } from '../../reports/monitoring-dashboard/monitoring-dashboard.component';
import { SopDashboardComponent } from '../../reports/sop-dashboard/sop-dashboard.component';
import { VehicleAnalysisDashboardComponent } from '../../reports/vehicle-analysis-dashboard/vehicle-analysis-dashboard.component';
import { UccChargeCollectionDashboardComponent } from '../../reports/ucc-charge-collection-dashboard/ucc-charge-collection-dashboard.component';
import { VehicleMaintenanceDashboardComponent } from '../../reports/vehicle-maintenance-dashboard/vehicle-maintenance-dashboard.component';
import { CameraVtsDashboardComponent } from '../../reports/camera-vts-dashboard/camera-vts-dashboard.component';
import { EmpMonitoringDashboardComponent } from '../../reports/emp-monitoring-dashboard/emp-monitoring-dashboard.component';





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
    // VTS

    GarbageCaptureAnalysisComponent,
    VtsReportComponent,
    VtsMonthlyReportComponent,
    VtsRouteComponent,
    CreateRoutesComponent,
    UploadRouteExcelComponent,
    BvgRoutesComponent,
    VtsAnalysisComponent,
    PenaltySummaryComponent,
    FieldExecutiveTrackingComponent,
    ShowRouteComponent,
    FieldExecutiveAttendanceComponent,
    FeDailyWorkReportComponent,



    IndexComponent,
    PortalAccessComponent,
    DashboardComponent,
    NotificationsComponent,
    WardMonitoringComponent,
    SkipLineComponent,
    HaltsComponent,
    LoginComponent,
    LogoutComponent,
    HouseEntryFormComponent,
    DownloadCollectionReportComponent,
    HouseSearchComponent,
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
    DustbinReportComponent,
    CmsComponent,
    Cms1Component,
    VehicleReportComponent,
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
    ChangePasswordComponent,
    VehicleFuelReportComponent,
    EmployeePenaltyComponent,
    PenaltyPortalServiceComponent,
    AccountDetailComponent,
    EmployeeSalaryComponent,
    SalaryHoldingManagementComponent,
    KmlToJsonComponent,
    SalaryTransactionComponent,
    DustbinServiceComponent,
    WardWorkTrackingComponent,
    StaffAccountDetailComponent,
    WardWorkPercentageComponent,
    ChangeLineSurveyedDataComponent,
    WardWorkDoneComponent,
    SettingsComponent,
    EmployeesComponent,
    SpecialUsersComponent,
    DustbinPlaningComponent,
    DustbinWardMappingComponent,
    LineWeightageComponent,
    DustbinManageComponent,
    RoutesTrackingComponent,
    SalaryCalculationComponent,
    DailyFuelReportComponent,
    SalaryCalculationsComponent,
    EmployeeAttendanceComponent,
    DailyWorkDetailComponent,
    SupportQueryComponent,
    MonthlyFuelReportComponent,
    VehicleBreakdownComponent,
    VehicleBreakdownReportComponent,
    ChangeLineMarkerDataComponent,
    AddVehicleBreakdownComponent,
    RolesComponent,
    RolePageAccessComponent,
    MapsComponent,
    CardMarkerMappingComponent,
    ScanCardStatusComponent,
    ComplaintListComponent,
    ScanCardManipulationComponent,
    AddMarkerAgainstCardsComponent,
    CardScanningReportComponent,
    SurveyVerificationComponent,
    SurveyHousesComponent,
    MarkerApprovalTestComponent,
    SupervisorReportComponent,
    SetNearbyWardComponent,
    ManageMarkingDataComponent,
    WardwiseScanCardComponent,
    ReviewDutyonImagesComponent,
    ReviewTripImagesComponent,
    PaymentCollectorComponent,
    DueAmountReportComponent,
    CollectedAmountReportComponent,
    SurveyVerifiedReportComponent,
    PaymentViaChequeComponent,
    PaymentViaChequeReportComponent,
    CardTransectionDetailComponent,
    CardUpdatedHistoryComponent,
    DailyPaymentReportComponent,
    MonthlyPaymentReportComponent,
    EntityPaymentReportComponent,
    WardRoadDetailComponent,
    UpdateSurveyorVirtualComponent,
    NonSalariedCalculationComponent,
    VehicleTrackingComponent,
    VheicleCurrentInfoComponent,
    SetMarkerImagesComponent,
    PaymentViaNeftComponent,
    PaymentViaNeftReportComponent,
    RemoveDeletedScancardsComponent,
    PenaltyReviewComponent,
    MonthlyAttendanceComponent,
    PaymentViaCitizenappComponent,
    PageLoadHistoryComponent,
    DatabaseUtilizationComponent,
    SecondaryCollectionMonitoringComponent,
    SecondaryCollectionAnalysisComponent,
    SecondaryCollectionPlaningComponent,
    SecondaryCollectionServiceComponent,
    SecondaryCollectionManageComponent,
    EntityModificationComponent,
    PaymentCollectorTrackingComponent,
    ErrorPageComponent,
    SecondaryCollectionWardMappingComponent,
    MonthlyWorkReportComponent,
    AssetsDashboardComponent,
    ComplaintDashboardComponent,
    FuelDashboardComponent,
    BikeFuelDashboardComponent,
    MonitoringDashboardComponent,
    SopDashboardComponent,
    VehicleAnalysisDashboardComponent,
    UccChargeCollectionDashboardComponent,
    VehicleMaintenanceDashboardComponent,
    CameraVtsDashboardComponent,
    EmpMonitoringDashboardComponent,
    WebPortalSettingComponent,
    WardRouteTrackingComponent,
    WardDutyOnComponent,
  ]
})

export class AdminLayoutModule { 

}
