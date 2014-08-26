var smartPrivateNpm = require("./lib");  
var url = require('url');
var rserver = url.parse(process.env.COUCH_SERVER||'http://localhost:5984');
rserver.vhost = process.env.VHOST||"localhost:3333";
rserver.secure=true;
console.log(rserver)
  //
  // Configure your private npm. You could load this in from a file
  // somewhere
  //
  var config = {
      writePrivateOk:true,
    //
    // Private npm options.
    //
    rewrites: require('./config/rewrites'),
    proxy: {
      //
      // This can optionally just be a single url.parsed URL or an array to
      // cycle through. Optionally you can also have an array of url.parsed urls
      // as well
      //
      npm: url.parse('https://registry.npmjs.org'),

      policy: {
        npm: rserver,
        private: {
          conversation:1,
          "engine-ui":1
        },
        blacklist: {
          //
          // This is the list of modules that will ALWAYS be proxies
          // to the private npm, no matter what.
          //
        },
        //whitelist: {
          //
          // If enabled: only requests for these modules will be served
          // by the proxy (unless they are "known private modules").
          //
        //},
        //
        // In "transparent mode" the proxy will always forward to
        // the public registry.
        //
        transparent: false
      }
    },
    //
    // Server options (from "create-servers")
    //
    http: 3333 //,
    //https: {
    //  port: 443,
    //  root: '/path/to/your/ssl/files',
    //  key: 'your-ssl.key',  // or .pem
    //  cert: 'your-ssl.cert' // or .pem
    //}
  };

  smartPrivateNpm.createServer(config, function (err, servers) {
    if (err) {
      console.log('Error starting private npm: %j', servers);
      return process.exit(1);
    }

    console.log('Private npm running on %j servers.', Object.keys(servers));
  });

