export type CivicSourceType = "socrata" | "arcgis" | "ckan_csv" | "carto" | "opendatasoft" | "static_csv";

export type CivicCityConfig = {
  id: string;
  city: string;
  state?: string;
  country: "US" | "CA";
  sourceType: CivicSourceType;
  domain?: string;
  datasetId?: string;
  tableName?: string;
  serviceName?: string;
  supportsLatLng: boolean;
  supportsAddress: boolean;
  signalTypes: string[];
  priority: "high" | "medium" | "low";
  socrataMapping?: {
    lat: string;
    lng: string;
    address: string;
    category: string;
    descriptor: string;
  };
  arcgisMapping?: {
    serviceKind: 'feature' | 'map';
    layerUrl: string;
    where: string;
    pageSize: number;
    exact?: {
      externalId?: string[];
      title?: string[];
      category?: string[];
      address?: string[];
      lat?: string[];
      lng?: string[];
      openedAt?: string[];
      closedAt?: string[];
      status?: string[];
    };
    candidates?: {
      externalId?: string[];
      title?: string[];
      category?: string[];
      address?: string[];
      lat?: string[];
      lng?: string[];
      openedAt?: string[];
      closedAt?: string[];
      status?: string[];
    };
  };
};

export const CIVIC_CITIES: CivicCityConfig[] = [
  {
    id: "nyc", city: "New York City", state: "NY", country: "US", sourceType: "socrata",
    domain: "data.cityofnewyork.us", datasetId: "erm2-nwe9", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "incident_address", category: "complaint_type", descriptor: "descriptor" }
  },
  {
    id: "sf", city: "San Francisco", state: "CA", country: "US", sourceType: "socrata",
    domain: "data.sfgov.org", datasetId: "vw6y-z8j6", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "lat", lng: "long", address: "address", category: "service_name", descriptor: "service_details" }
  },
  {
    id: "chicago", city: "Chicago", state: "IL", country: "US", sourceType: "socrata",
    domain: "data.cityofchicago.org", datasetId: "v6vf-nfxy", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "street_address", category: "sr_type", descriptor: "sr_short_code" }
  },
  {
    id: "austin", city: "Austin", state: "TX", country: "US", sourceType: "socrata",
    domain: "data.austintexas.gov", datasetId: "xwdj-i9he", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "sr_location_lat", lng: "sr_location_long", address: "sr_location", category: "sr_type_desc", descriptor: "sr_department_desc" }
  },
  {
    id: "dallas", city: "Dallas", state: "TX", country: "US", sourceType: "socrata",
    domain: "www.dallasopendata.com", datasetId: "nftr-hpic", supportsLatLng: false, supportsAddress: true,
    signalTypes: ["code_violation"], priority: "high",
    socrataMapping: { lat: "lat", lng: "lon", address: "location_address", category: "type", descriptor: "nuisance" }
  },
  {
    id: "seattle", city: "Seattle", state: "WA", country: "US", sourceType: "socrata",
    domain: "data.seattle.gov", datasetId: "5ngg-rpne", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "location", category: "webintakeservicerequests", descriptor: "departmentname" }
  },
  {
    id: "oakland", city: "Oakland", state: "CA", country: "US", sourceType: "socrata",
    domain: "data.oaklandca.gov", datasetId: "quth-gb8e", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "sry", lng: "srx", address: "reqaddress", category: "reqcategory", descriptor: "description" }
  },
  {
    id: "baton_rouge", city: "Baton Rouge", state: "LA", country: "US", sourceType: "socrata",
    domain: "data.brla.gov", datasetId: "7ixm-mnvx", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "streetaddress", category: "parenttype", descriptor: "typename" }
  },
  {
    id: "nola", city: "New Orleans", state: "LA", country: "US", sourceType: "socrata",
    domain: "data.nola.gov", datasetId: "2jgv-pqrq", supportsLatLng: true, supportsAddress: false,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "location", category: "request_type", descriptor: "request_reason" }
  },
  {
    id: "dc", city: "Washington, D.C.", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
      serviceKind: 'feature',
      layerUrl: 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21',
      where: '1=1',
      pageSize: 1000,
      exact: {
        externalId: ['SERVICEREQUESTID'],
        title: ['SERVICECODEDESCRIPTION', 'SERVICETYPECODEDESCRIPTION'],
        category: ['SERVICETYPECODEDESCRIPTION', 'SERVICECODEDESCRIPTION'],
        address: ['STREETADDRESS'],
        lat: ['LATITUDE'],
        lng: ['LONGITUDE'],
        openedAt: ['ADDDATE'],
        closedAt: ['RESOLUTIONDATE'],
        status: ['SERVICEORDERSTATUS', 'STATUS_CODE']
      }
    }
  },
  {
    id: "baltimore", city: "Baltimore", state: "MD", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
      serviceKind: 'feature',
      layerUrl: 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/ArcGIS/rest/services/311_Customer_Service_Requests_2025/FeatureServer/0',
      where: '1=1',
      pageSize: 2000,
      exact: {
        externalId: ['SRRecordID', 'ServiceRequestNum'],
        title: ['SRType'],
        category: ['SRType'],
        address: ['Address'],
        lat: ['Latitude'],
        lng: ['Longitude'],
        openedAt: ['CreatedDate'],
        closedAt: ['CloseDate', 'StatusDate'],
        status: ['SRStatus']
      }
    }
  },
  {
    id: "nashville", city: "Nashville", state: "TN", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'feature',
        layerUrl: 'https://services2.arcgis.com/HdTo6HJqh92wn4D8/ArcGIS/rest/services/hubNashville_311_Service_Requests_2023_view/FeatureServer/0',
        where: '1=1',
        pageSize: 2000,
        exact: {
            externalId: ['Request__'],
            title: ['Request_Type', 'Subrequest_Type'],
            category: ['Subrequest_Type', 'Request_Type'],
            address: ['Address'],
            lat: ['Latitude'],
            lng: ['Longitude'],
            openedAt: ['Date_Time_Opened'],
            closedAt: ['Date_Time_Closed'],
            status: ['Status']
        }
    }
  },
  {
    id: "charlotte", city: "Charlotte", state: "NC", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'map',
        layerUrl: 'https://gis.charlottenc.gov/arcgis/rest/services/ODP/ServiceRequests311/MapServer/0',
        where: '1=1',
        pageSize: 7500,
        exact: {
            externalId: ['REQUEST_NO'],
            title: ['REQUEST_TYPE', 'TITLE'],
            category: ['REQUEST_TYPE'],
            address: ['FULL_ADDRESS'],
            lat: ['LATITUDE'],
            lng: ['LONGITUDE'],
            openedAt: ['RECEIVED_DATE'],
            closedAt: [],
            status: []
        }
    }
  },
  {
    id: "louisville", city: "Louisville", state: "KY", country: "US", sourceType: "arcgis", priority: "medium",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'feature',
        layerUrl: 'https://services1.arcgis.com/79kfd2K6fskCAkyg/arcgis/rest/services/metro_311_2025/FeatureServer/0',
        where: '1=1',
        pageSize: 1000,
        candidates: {
            externalId: ['service_request_id', 'SERVICE_REQUEST_ID', 'objectid'],
            title: ['service_name', 'SERVICE_NAME', 'request_type', 'REQUEST_TYPE'],
            category: ['category', 'CATEGORY', 'service_name', 'SERVICE_NAME'],
            address: ['address', 'ADDRESS', 'full_address', 'FULL_ADDRESS'],
            lat: ['latitude', 'LATITUDE'],
            lng: ['longitude', 'LONGITUDE'],
            openedAt: ['requested_datetime', 'REQUESTED_DATETIME'],
            closedAt: ['closed_date', 'CLOSED_DATE'],
            status: ['status', 'STATUS']
        }
    }
  },
  {
    id: "indianapolis", city: "Indianapolis", state: "IN", country: "US", sourceType: "arcgis", priority: "medium",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'feature',
        layerUrl: 'https://gis.indy.gov/server/rest/services/OpenData/ODP_RIMACServiceRequests/FeatureServer/0',
        where: '1=1',
        pageSize: 2000,
        candidates: {
            externalId: ['SERVICE_REQUEST_ID', 'REQUEST_NO', 'REQUESTID', 'OBJECTID'],
            title: ['SERVICENAME', 'REQUEST_TYPE', 'SERVICE_NAME'],
            category: ['SERVICENAME', 'REQUEST_TYPE', 'CATEGORY'],
            address: ['ADDRESS', 'FULL_ADDRESS', 'STREETADDRESS', 'SITEADDRESS'],
            lat: ['LATITUDE', 'LAT', 'Y'],
            lng: ['LONGITUDE', 'LON', 'X'],
            openedAt: ['REQUESTDATE', 'OPENED_DATE', 'CREATED_DATE', 'CREATEDATE'],
            closedAt: ['CLOSEDDATE', 'CLOSED_DATE', 'RESOLUTIONDATE'],
            status: ['STATUS', 'SRSTATUS', 'SERVICE_STATUS']
        }
    }
  },
  {
      id: "cleveland", city: "Cleveland", state: "OH", country: "US", sourceType: "arcgis", priority: "medium",
      supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
      arcgisMapping: {
          serviceKind: 'feature',
          layerUrl: 'https://services3.arcgis.com/dty2kHktVXHrqO8i/arcgis/rest/services/Data_311/FeatureServer/0',
          where: '1=1',
          pageSize: 2000,
          candidates: {
              externalId: ['SERVICE_REQUEST_ID', 'CASE_ID', 'REQUEST_ID', 'OBJECTID'],
              title: ['REQUEST_TYPE', 'SERVICE_NAME', 'TYPE', 'CATEGORY'],
              category: ['CATEGORY', 'REQUEST_TYPE', 'SERVICE_NAME'],
              address: ['ADDRESS', 'FULL_ADDRESS', 'LOCATION', 'STREETADDRESS'],
              lat: ['LATITUDE', 'LAT', 'Y'],
              lng: ['LONGITUDE', 'LON', 'X'],
              openedAt: ['CREATED_DATE', 'OPEN_DATE', 'REQUEST_DATE'],
              closedAt: ['CLOSED_DATE', 'CLOSE_DATE', 'RESOLUTIONDATE'],
              status: ['STATUS', 'SRSTATUS', 'CASE_STATUS']
          }
      }
  },
  {
      id: "minneapolis", city: "Minneapolis", state: "MN", country: "US", sourceType: "arcgis", priority: "medium",
      supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
      arcgisMapping: {
          serviceKind: 'feature',
          layerUrl: 'https://services.arcgis.com/afSMGVsC7QlRK1kZ/ArcGIS/rest/services/Public_311_2026/FeatureServer/0',
          where: '1=1',
          pageSize: 2000,
          candidates: {
              externalId: ['service_request_id', 'SERVICE_REQUEST_ID', 'OBJECTID'],
              title: ['service_name', 'SERVICE_NAME', 'request_type', 'REQUEST_TYPE'],
              category: ['category', 'CATEGORY', 'service_name', 'SERVICE_NAME'],
              address: ['address', 'ADDRESS', 'full_address', 'FULL_ADDRESS'],
              lat: ['latitude', 'LATITUDE'],
              lng: ['longitude', 'LONGITUDE'],
              openedAt: ['requested_datetime', 'REQUESTED_DATETIME', 'created_date'],
              closedAt: ['closed_date', 'CLOSED_DATE', 'resolutiondate'],
              status: ['status', 'STATUS']
          }
      }
  },
  {
      id: "miami_dade", city: "Miami-Dade County", state: "FL", country: "US", sourceType: "arcgis", priority: "medium",
      supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
      arcgisMapping: {
          serviceKind: 'feature',
          layerUrl: 'https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/ArcGIS/rest/services/data_311_2023/FeatureServer/0',
          where: '1=1',
          pageSize: 2000,
          candidates: {
            externalId: ['service_request_id', 'SERVICE_REQUEST_ID', 'REQUEST_ID', 'OBJECTID'],
            title: ['service_name', 'SERVICE_NAME', 'request_type', 'REQUEST_TYPE'],
            category: ['category', 'CATEGORY', 'request_type', 'REQUEST_TYPE'],
            address: ['address', 'ADDRESS', 'full_address', 'FULL_ADDRESS'],
            lat: ['latitude', 'LATITUDE'],
            lng: ['longitude', 'LONGITUDE'],
            openedAt: ['requested_datetime', 'REQUESTED_DATETIME', 'created_date'],
            closedAt: ['closed_date', 'CLOSED_DATE', 'resolutiondate'],
            status: ['status', 'STATUS']
          }
      }
  }
];
