
// import { system } from 'src/lib/Stores';
import proj4 from 'proj4';

// Define Faroese projection
proj4.defs("EPSG:5316","+proj=tmerc +lat_0=0 +lon_0=-7 +k=0.999997 +x_0=200000 +y_0=-6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");