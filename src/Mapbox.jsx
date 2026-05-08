
import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import { PathFinder } from './pathfinder';
import { toast } from "react-toastify";


function Mapbox() {
    
    const mapRef = useRef(null)
    const mapContainerRef = useRef()
    const mapPopupRef = useRef(null)

    const lowerLat = 1.2;
    const upperLat = 1.48;
    const lowerLong = 103.59;
    const upperLong = 104.05;
    
    const startCodeRef = useRef();
    const endCodeRef = useRef();
    const PathFinderRef = useRef( new PathFinder() )
    const neighboursRef = useRef();
    const [loading, setLoading] = useState(false);

    const [startId, setStartId] = useState("")
    const [endId, setEndId] = useState("")

    
    //---------------------
    const mapOnClick = (e) => {
        
        const feature = e.features[0]
        mapPopupRef.current = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(`
                <div><b>${ feature.properties.number }</b></div>
                <div>${ feature.properties.name }</div>
                <div>${  JSON.parse( feature.properties.services ).join(", ") }</div>
                <div style="margin-top:8px;">
                    <button class="start-btn rounded-md border p-2 text-white bg-black" data-id="${feature.properties.number}">
                        Mark Start
                    </button>

                    <button class="end-btn rounded-md border p-2 text-white bg-black" data-id="${feature.properties.number}">
                        Mark End
                    </button>
                </div>
            `)
            .addTo(mapRef.current)
        
    }


    //------
    const markStart = ( BusStopCode ) => { 
        if ( mapPopupRef.current) {
            mapPopupRef.current.remove()
            mapPopupRef.current = null
        }
                
        mapRef.current.getSource('start-point').setData({
            type: 'FeatureCollection',
            features: [
            {
                type: 'Feature',
                geometry: {
                type: 'Point',
                    coordinates: [ 
                        neighboursRef.current[ BusStopCode ][0], 
                        neighboursRef.current[ BusStopCode  ][1]  
                    ]
                },
                properties: {
                }
            }
            ]
        })
    }
    const markEnd = ( BusStopCode ) => {

        if ( mapPopupRef.current) {
            mapPopupRef.current.remove()
            mapPopupRef.current = null
        }

        mapRef.current.getSource('end-point').setData({
            type: 'FeatureCollection',
            features: [
            {
                type: 'Feature',
                geometry: {
                type: 'Point',
                    coordinates: [ 
                        neighboursRef.current[ BusStopCode  ][0], 
                        neighboursRef.current[ BusStopCode  ][1]  
                    ]
                },
                properties: {
                }
            }
            ]
        })
    }



    //--------------
    const mapButtonOnclick = (e) => {

        const startBtn = e.target.closest('.start-btn')
        if (startBtn) {
            
            setStartId(startBtn.dataset.id)
            markStart( startBtn.dataset.id )
            return;
        }

        const endBtn = e.target.closest('.end-btn')
        if (endBtn) {
            setEndId( endBtn.dataset.id )
            markEnd( endBtn.dataset.id )
            return ;
        }
    }


    //--------------------
    const btnGoOnClick = ( ) => {
        
        const startCode = startCodeRef.current.value;
        const endCode   = endCodeRef.current.value;
        
        
        if ( neighboursRef.current[startCode] && neighboursRef.current[endCode] ) {

            markStart( startCode )
            markEnd( endCode )

            setLoading(true); 
            let solution = PathFinderRef.current.findPath( neighboursRef.current, startCode, endCode )
            
            if ( solution.length > 0 ) {
                
                let coordinates = [];
                let features    = [];
                
                for ( let i = 0 ; i < solution.length ; i++ ) {

                    let stopCode        = solution[i]
                    if ( neighboursRef.current[stopCode] ) {
                        coordinates.push( 
                            [ neighboursRef.current[stopCode][0], neighboursRef.current[stopCode][1]  ]
                        )

                        let start_text  = ""
                        let middle_text = ""
                        let end_text    = ""

                        if ( i == 0 ) {
                            start_text = "Begin\n";
                        }
                        if ( i < solution.length - 1 ) {
                    
                            let next_stopCode   = solution[i+1] 
                            let neighbour_index = neighboursRef.current[stopCode][4].findIndex( (item)=> item.includes( next_stopCode ) );
                            middle_text = 'Take bus ' + neighboursRef.current[stopCode][4][ neighbour_index ][1].join(", ") + "\n"
                        }
                        if ( i == solution.length - 1 ) {
                            end_text = "End\n";
                        }

                        features.push( 
                            {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [ neighboursRef.current[stopCode][0], neighboursRef.current[stopCode][1]  ]
                                },
                                properties: {
                                    text: ( start_text + middle_text + end_text )
                                }
                            }
                        )
                        
                    }
                }

                mapRef.current.flyTo({
                    center: coordinates[0], // longitude, latitude (e.g. Singapore)
                    zoom: 14,
                    speed: 1.2,        // animation speed (higher = faster)
                    curve: 1.42,       // controls the flight path curvature
                    essential: true    // respects reduced-motion preferences
                });


                let source = mapRef.current.getSource('lines')
                source.setData({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                })

                source = mapRef.current.getSource('route-labels');
                source.setData({
                    type: 'FeatureCollection',
                    features: features
                })



                toast.success("Find Path success");
            } else {
                toast.error("Unable to find a path from " + startCode + " to " + endCode );
            }
            setLoading(false);
        
        } else {
            if ( !neighboursRef.current[startCode] ) {
                toast.error("No such start code");
            } 
            if ( !neighboursRef.current[endCode] ) { 
                toast.error("No such end code");
            }
            return ;
        
        }
        
    }
    
    //------------------
    useEffect(() => {
        mapboxgl.accessToken = 'pk.eyJ1IjoidGVuc2FpeDJqIiwiYSI6ImNtb3dyZWY1ajA0ZXAycHI1dTh3YnpwNGcifQ.uk3ht-4S3lorF_WbRMmb3g'
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: [  103.8, 1.39 ], // starting position [lng, lat]. Note that lat must be set between -90 and 90
            zoom: 5, // starting zoom
            bounds: [lowerLong, lowerLat, upperLong, upperLat],
            minZoom: 8,
            attributionControl: false
        });

        
        mapRef.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            })
        )
        
        mapRef.current.on('load', async () => {

            console.log( "hello",import.meta.env.BASE_URL );

            const res = await fetch(`${import.meta.env.BASE_URL}/data/stops.min.geojson`)
            const geojson = await res.json()

            const res2 = await fetch(`${import.meta.env.BASE_URL}/data/neighbours.min.json`)
            neighboursRef.current = await res2.json()
            
            mapRef.current.loadImage(`${import.meta.env.BASE_URL}/images/startflag.png`, (error, image) => {
                if (error) throw error
                mapRef.current.addImage('start-icon', image)
            })

            mapRef.current.loadImage(`${import.meta.env.BASE_URL}/images/endflag.png`, (error, image) => {
                if (error) throw error
                mapRef.current.addImage('end-icon', image)
            })
            

            mapRef.current.addSource('stops', {
                type: 'geojson',
                data: geojson
            })

            mapRef.current.addSource('lines', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            })

            mapRef.current.addSource('route-labels', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [
                    ]
                }
            })

            mapRef.current.addSource('start-point', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            })

            mapRef.current.addSource('end-point', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            })



            mapRef.current.addLayer({
                id: 'stops-layer',
                type: 'circle',
                source: 'stops',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#81360b',
                    'circle-stroke-width': 12,
                    'circle-stroke-color': 'rgba(0,0,0,0)',
                }
            })


            
            mapRef.current.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'lines',
                paint: {
                    'line-color': '#ff4400',
                    'line-width': 4
                }
            })

            mapRef.current.addLayer({
                id: 'route-label-layer',
                type: 'symbol',
                source: 'route-labels',
                layout: {
                    'text-field': ['get', 'text'],
                    'text-size': 10,
                    'text-anchor': 'top',
                    'text-offset': [0,  1.0],
                    'text-max-width': 20,
                    'text-allow-overlap': true,
                    'text-ignore-placement': true

                },
                paint: {
                    'text-color': '#000000'
                }
            })

            mapRef.current.addLayer({
                id: 'start-layer',
                type: 'symbol',
                source: 'start-point',
                layout: {
                    'icon-image': 'start-icon',
                    'icon-size': 0.4,
                    'icon-anchor': 'bottom-left'
                }
            })

            mapRef.current.addLayer({
                id: 'end-layer',
                type: 'symbol',
                source: 'end-point',
                layout: {
                    'icon-image': 'end-icon',
                    'icon-size': 0.4,
                    'icon-anchor': 'bottom-left'
                }
            })
            
            mapRef.current.on('click', 'stops-layer', mapOnClick );
            mapRef.current.getContainer().addEventListener('click', mapButtonOnclick );
        })

        
        return () => {
            mapRef.current.off('click', 'stops-layer', mapOnClick);
            mapRef.current.getContainer().removeEventListener('click', mapButtonOnclick );
            mapRef.current.remove();
        }
    }, [])

    
    

    return (
    <>
        <div id='map-container' ref={mapContainerRef} className="w-full h-full" />
      
        <div className="fixed top-[10px] left-[10px] flex flex-col gap-[10px] bg-[rgba(0,0,0,0.5)] rounded-md p-5 z-100 items-stretch w-[200px]">

            <div className="grid grid-cols-[25%_75%] grid-rows-2 gap-1">
  
                <div className="flex items-center text-white">Start:</div>
                <div>
                    <input
                    ref={startCodeRef}
                    type="text"
                    onChange={(e) => setStartId(e.target.value)}
                    value={startId}
                    placeholder="BusStop Code"
                    className="w-full bg-white rounded-md px-2 py-1 box-border"
                    />
                </div>

                <div className="flex items-center text-white">End:</div>
                <div>
                    <input
                    ref={endCodeRef}
                    type="text"
                    value={endId}
                    onChange={(e) => setEndId(e.target.value)}
                    placeholder="BusStop Code"
                    className="w-full bg-white rounded-md px-2 py-1 box-border"
                    />
                </div>

            </div>

            <div className="flex-1 self-stretch">
                {!loading && (
                    <button className="w-full h-full bg-black text-white rounded-md" onClick={ btnGoOnClick } >Go</button>
                )}
                {loading && <p className="text-white">Calculating...</p>}
            </div>

            <div className="flex-1 text-white text-xs">
                You can key in manually or click on the dots to mark Start/End points.
            </div>
            
            
        </div>
        
    </>
  )

}

export default Mapbox
