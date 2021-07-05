export interface Users {
    userId:any;
    name:string;
    email:string;
    mobile:string;
    password:string;
    userType:string;
    creattionDate:string;
    isDelete:any;
    notificationHalt:any;
    notificationMobileDataOff:any; 
    notificationSkippedLines:any;
    notificationPickDustbins:any;
    expiryDate:any;
    notificationGeoSurfing:any;
    officeAppUserId:any;
    isTaskManager:any;
}

export interface UserAccess {
    $Key:any;
    userId:any;
    pageID:string;
}


export interface Remarks {
    $Key:any;
    userId:any;
    category:any;
    remark:string;
    time:string;
    image:string;
}


