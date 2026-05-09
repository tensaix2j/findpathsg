


//----------
class MinHeap {
        
    heap;
    compare_function;

    //---------------
    init( compare_function ) {
        /* Initialing the array heap and adding a dummy element at index 0 */
        this.heap = [null]
        
        if ( compare_function != null ) {
            this.compare_function = compare_function;
        } else {
            this.compare_function = function(a,b) {
                return a < b;
            }
        }
    }
    
    //---------------
    getMin() {
        /* Accessing the min element at index 1 in the heap array */
        return this.heap[1]
    }
    

    //-------------
    swap( a, b ) {

        var tmp = this.heap[a];
        this.heap[a] = this.heap[b];
        this.heap[b] = tmp;
    }

    //---------------
    push(node) {

        /* Inserting the new node at the end of the heap array */
        this.heap.push(node)

        /* Finding the correct position for the new node */

        if (this.heap.length > 1) {
            let current = this.heap.length - 1

            /* Traversing up the parent node until the current node (current) is greater than the parent (current/2)*/
            while (current > 1 &&  this.compare_function( this.heap[current] , this.heap[Math.floor(current/2)] ) ) {

                /* Swapping the two nodes by using the ES6 destructuring syntax*/
                this.swap(  Math.floor(current/2)   ,  current  ) ;
                current = Math.floor(current/2);

            }
        }
    }
    

    //-----
    length() {
        return this.heap.length - 1;
    }



    //---------------
    pop( ) {
        
        /* Smallest element is at the index 1 in the heap array */
        let smallest = this.heap[1]

        /* When there are more than two elements in the array, we put the right most element at the first position
            and start comparing nodes with the child nodes
        */
        if (this.heap.length > 2) {
            this.heap[1] = this.heap[this.heap.length-1]
            this.heap.splice(this.heap.length - 1)

            if (this.heap.length === 3) {
                if (  this.compare_function(  this.heap[2] , this.heap[1] )   ) {
                    this.swap( 1, 2 );
                }
                return smallest
            }

            let current = 1
            let leftChildIndex = current * 2
            let rightChildIndex = current * 2 + 1

                
            while (  this.heap[leftChildIndex] &&
                    this.heap[rightChildIndex] &&
                    ( !this.compare_function( this.heap[current] , this.heap[leftChildIndex] ) ||
                    !this.compare_function( this.heap[current] , this.heap[rightChildIndex] )    )) {



                if ( this.compare_function( this.heap[leftChildIndex] , this.heap[rightChildIndex] )  ) {

                    this.swap( current , leftChildIndex  ) ;
                    current = leftChildIndex
                
                } else {
                    
                    this.swap( current , rightChildIndex  ) ;
                    current = rightChildIndex
                }

                leftChildIndex = current * 2
                rightChildIndex = current * 2 + 1
            }
        }

        /* If there are only two elements in the array, we directly splice out the first element */

        else if (this.heap.length === 2) {
            this.heap.splice(1, 1)
        } else {
            return null
        }

        return smallest
    }
}


//-----------------------
export class PathFinder {

    nodes = {};

    //--------------
    haversine(lat1, lng1, lat2, lng2) {

        const R = 6371; // Earth radius in kilometers

        // convert degrees to radians
        const toRad = (value) => (value * Math.PI) / 180;

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δφ = toRad(lat2 - lat1);
        const Δλ = toRad(lng2 - lng1);

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // distance in kilometers
    }

        
    //------------------------------
    getDistance( busStops, n_stopId , endId ) {
        let lat1 = busStops[ n_stopId ][1];
        let lng1 = busStops[ n_stopId ][0];
        let lat2 = busStops[ endId ][1];
        let lng2 = busStops[ endId ][0];
        let dist = this.haversine( lat1, lng1, lat2, lng2 );
        return Math.abs( dist );
    }
    

    //--------------------
    getNeighbors( neighborList ) {

        let neighbors   = [];
        if ( neighborList && neighborList.length > 0 ) {
            for ( let i = 0 ; i < neighborList.length ; i++ ) {

                let neighbor = neighborList[i];
                let neighborId = neighbor[0];

                let node = this.createNode( neighborId );
                neighbors.push( node );
            }
        }
        return neighbors;
    }



    //------------------
    backtrace ( node ) {

        let solution = [ node["stopId"] ];
        while (node["parent"] != null ) {
            node = node["parent"];
            solution.unshift( node["stopId"] );   
        }   
        return solution;     
    }
    
    
     //--------
    createNode( stopId ) {

        var node = this.nodes[ stopId ]; 
        if ( node == null ) {
            node = {};
            node["stopId"] = stopId;
            node["walkable"] = 1;
            node["opened"] = false;
            node["closed"] = false;
            node["parent"] = null ;
        }
        this.nodes[ stopId ] = node;        
        return node;
    }
    


    //----------
    clearNodes() {
        for ( let key in this.nodes ) {
            delete this.nodes[key]
        }   
    }
    
    
    //---------------------
    findPath( busStops, startId, endId ) {

        this.busStops = busStops;
        if ( startId == endId ) {
            return [ startId ];
        }

        this.clearNodes();

        this.startNode           = this.createNode( startId );
        this.endNode             = this.createNode( endId   );
        var maxiteration        = 10000;

        // set the `g` and `f` value of the start node to be 0
        this.startNode["g"] = 0;
        this.startNode["f"] = 0;

        var openList = new MinHeap()
        openList.init( function(a,b) {
            return a["f"] < b["f"];
        });


        // push the start node into the open list
        openList.push( this.startNode );
        
        
        // while the open list is not empty
        var iteration = 0;
        while ( openList.length() > 0  ) {

            // pop the position of node which has the minimum `f` value.
            var node = openList.pop();
            node["closed"] = true;


            
            // if reached the end position, construct the path and return it
            if ( node === this.endNode ) {
                return this.backtrace( this.endNode );
            }

            
            // get neigbours of the current node
            var neighbors = this.getNeighbors( this.busStops[ node["stopId"] ][4] );
            //console.log( "stopId:", node["stopId"], "neighbour count:", neighbors.length, "openList", openList.length() );

            if ( neighbors.length > 0 ) {

                var i ;
                for ( i = 0 ; i < neighbors.length ; ++i ) {

                    var neighbor = neighbors[i];
                    
                    if (neighbor["closed"]) {
                        continue;
                    }

                    var n_stopId = neighbor["stopId"];
                    
                    // get the distance between current node and the neighbor
                    // and calculate the next g score
                    var ng = node["g"] + this.getDistance( busStops, node["stopId"] , n_stopId ) ;

                    // check if the neighbor has not been inspected yet, or
                    // can be reached with smaller cost from the current node
                    if ( !neighbor["opened"] || ng < neighbor["g"]) {
                        
                        neighbor["g"] = ng;
                        neighbor["h"] = neighbor["h"] || this.getDistance( busStops, n_stopId, endId  );
                        neighbor["f"] = neighbor["g"] + neighbor["h"];
                        neighbor["parent"] = node;

                        if ( !neighbor["opened"] ) {

                            openList.push(neighbor);
                            neighbor["opened"] = true;

                        } else {
                            neighbor["g"] = ng;
                        }
                    }

                
                
                } // end for each neighbor
            } else {
                // No neighbor from this node.
                break;
            }

            iteration += 1;
            //console.log( "iteration", iteration );
            if ( iteration >= maxiteration ) {
                console.log("iteration over ", maxiteration );
                break;
            }

        } // end while not open list empty

        // fail to find the path
        return [];

    }
}
