import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import App from './App';
import { AgentsPage } from './pages/agents-page';
import { CustomersPage } from './pages/customers-page';
import { DashboardPage } from './pages/dashboard-page';
import { DriversPage } from './pages/drivers-page';
import { VehicleTypesPage } from './pages/vehicle-types-page';
import { VehiclesPage } from './pages/vehicles-page';

type Mode='list'|'create'|'edit'|'detail';
function ResourcePage({resource,mode,id}:{resource:string;mode:Mode;id?:string}){
  if(resource==='vehicle-types')return <VehicleTypesPage mode={mode} id={id}/>;
  if(resource==='vehicles')return <VehiclesPage mode={mode} id={id}/>;
  if(resource==='drivers')return <DriversPage mode={mode} id={id}/>;
  if(resource==='customers')return <CustomersPage mode={mode} id={id}/>;
  if(resource==='agents')return <AgentsPage mode={mode} id={id}/>;
  return <section className="page-card"><h1>Page not found</h1></section>;
}
const rootRoute=createRootRoute({component:App});
const indexRoute=createRoute({getParentRoute:()=>rootRoute,path:'/',component:DashboardPage});
const listRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$resource',component:()=>{const{resource}=listRoute.useParams();return <ResourcePage resource={resource} mode="list"/>;}});
const createResourceRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$resource/new',component:()=>{const{resource}=createResourceRoute.useParams();return <ResourcePage resource={resource} mode="create"/>;}});
const detailRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$resource/$id',component:()=>{const{resource,id}=detailRoute.useParams();return <ResourcePage resource={resource} id={id} mode="detail"/>;}});
const editRoute=createRoute({getParentRoute:()=>rootRoute,path:'/$resource/$id/edit',component:()=>{const{resource,id}=editRoute.useParams();return <ResourcePage resource={resource} id={id} mode="edit"/>;}});
const routeTree=rootRoute.addChildren([indexRoute,listRoute,createResourceRoute,detailRoute,editRoute]);
export const router=createRouter({routeTree});
declare module '@tanstack/react-router'{interface Register{router:typeof router}}
