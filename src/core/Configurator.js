/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global define: false, console: false, window: false, setTimeout: false */


define( function ( require ) {
    
    /* Configuration Node
     * 
     * Structure for storing configuration settings
     */
    var ConfNode = function( name, parent ) {
        
        var self = this;
        
        self.name = name;
        self.parent = parent;
        self.children = {};
        self.listeners = {};
        
        // Node's configuration value
        var _value = '';
        Object.defineProperty( self, 'value', {
            get: function() {
                return _value;
            },
            
            set: function( value ) {
                if ( _value !==  value ) {  // Additionally check if incoming value is string?
                
                    // Meaningful change, notify parent
                    if ( parent ) {
                        parent.notify( self.name );
                    }
                    
                    _value = value;
                }
            }
        });
        
        // Traverse the node tree given a path
        self.traverse = function( path, doCreatePath ) {
            
            var rv = undefined;
            
            if ( path.length == 1 && path.charAt( 0 ) == '/' ) {
                rv = self;
            } else {
                
                // Parse path and traverse the node tree
                var pathElems = path.split('/');
                var curNode = self;
                var successful = true;
                for ( var i = 0; successful && i < pathElems.length; ++ i ) {
                    var curElem = pathElems[i];
                    
                    if ( curElem != '' ) {
                        
                        // Look for name in children of current node
                        var nextNode = curNode.children[curElem];
                        if ( nextNode != undefined ) {
                            curNode = nextNode;
                        } else if ( doCreatePath ) {
                            nextNode = new ConfNode( curElem, curNode );
                            curNode.children[curElem] = nextNode;
                            curNode = nextNode;
                        } else {
                            // Path leads nowhere, leave
                            successful = false;
                            break;
                        }
                    }
                }
                
                if ( successful ) {
                    rv = curNode;
                }
            }
            
            return rv;
        };
        
        // Notify that a value under a child node has changed
        self.notify = function ( childName ) {
            
        };
        
        // Add a listener to this node's list of listeners
        self.addListener = function( clientId, listener ) {
            self.listeners[clientId] = listener;
        };
        
        // Remove an existing listener
        self.removeListener = function( clientId ) {
            if ( self.listeners[clientId] != undefined ) {
                delete self.listeners[clientId];
            }
        };
    };

    
    /* Configurator
     *
     * Loads and stores configuration data. Allows external code to listen for
     * changes in configuration subtrees.
     *
     * Initially written by Hasan (northWind) Kamal-Al-Deen
     */
    var Configurator = function( defaultConfiguration ) {

        var self = this;
        
        defaultConfiguration = defaultConfiguration || {};
        
        // Client front-end functions
        
        // Get a value based on a given path
        self.get = function( path ) {
            var rv = '';
            
            var targetNode = self.node.traverse( path );
            
            if ( targetNode !== undefined ) {
                rv = targetNode.value;
            }
            
            return rv;
        };
        
        // Set a value based on a given path
        self.set = function( path, value ) {
            var targetNode = self.node.traverse( path, true );
            
            targetNode.value = value;
        };
        
        // Update configuration with given json object
        self.update = function( json ) {
            for ( var key in json ) {
                if (json.hasOwnProperty( key )) {   // Performance Note: perhaps protecting against the prototype is not required?
                    self.set( key, json[key] )
                }
            }
        };
        
        // TODO: FIXME Dirty Dirty Hack
        self.constructor = Configurator;
        
        // Associate client front end with tree root
        self.node = new ConfNode( 'ROOT', undefined );
        
        // Load default configuration
        self.update( defaultConfiguration );
    };

    return Configurator;
});
