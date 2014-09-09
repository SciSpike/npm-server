var smartPrivateNpm = require("./lib"); 
var fs = require('fs');
var url = require('url');
var couchPassword = process.env.COUCH_PASSWORD || "password";
var couchServer = process.env.COUCH_SERVER||'http://127.0.0.1:5984';
var rserver = url.parse(couchServer);
rserver.vhost = process.env.VHOST||"localhost:3333";
rserver.secure=true;
console.log(rserver);

var aserver = url.parse(couchServer);
aserver.vhost = process.env.VHOST_CENTRAL||"localhost:5984";
var privateFile = "./private.json";
var privateJson = require(privateFile);
var privatePackages = privateJson.packages;
var follow = require('follow');
var followDB = couchServer.replace('://',"://"+"admin:"+couchPassword+"@") + '/registry';
var feed = new follow.Feed({
  db : followDB,
  since : privateJson.version
})

feed.on('change', function(change) {
  console.log('[follow]',JSON.stringify(change,null,2));
  privateJson.version = change.seq;
  if (change.hasOwnProperty('deleted') && change.deleted) {
    delete privatePackages[change.id];
  } else {
    privatePackages[change.id]=1;
  }
  fs.writeFile(privateFile,JSON.stringify(privateJson,null,2),function(err){
    if(err){
      console.log(err.stack);
    }
  })
})

feed.on('error', function(err) {
  console.log('[follow]', err);
  process.exit(1);
})

console.log(aserver);
  //
  // Configure your private npm. You could load this in from a file
  // somewhere
  //
  var config = {
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
        auth: aserver,
        private: privatePackages,
        blacklist: {
          conversation:1
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
    http: process.env.PORT||3333 //,
    //https: {
    //  port: 443,
    //  root: '/path/to/your/ssl/files',
    //  key: 'your-ssl.key',  // or .pem
    //  cert: 'your-ssl.cert' // or .pem
    //}
  };

  smartPrivateNpm.createServer(config, function (err, servers) {
    if (err) {
      console.log('Error starting private npm: %j, %s', servers, err.stack);
      return process.exit(1);
    }
    feed.follow();
    console.log('Private npm running on %j servers.', Object.keys(servers));
  });

