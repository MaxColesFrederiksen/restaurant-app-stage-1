class DBHelper{static get DATABASE_URL(){return`http://localhost:${1337}/restaurants`}static get DB_NAME(){return"db-v5"}static get DB_VERSION(){return 5}static lazyLoadImages(){var b=[].slice.call(document.querySelectorAll("img.lazy"));if("IntersectionObserver"in window){let c=new IntersectionObserver(function(d){d.forEach(function(f){if(f.isIntersecting)if("static_map"===f.target.id);else{let g=f.target;g.src=g.dataset.src,g.srcset=g.dataset.srcset,g.classList.remove("lazy"),c.unobserve(g)}})});b.forEach(function(d){c.observe(d)})}else;}static postReviewsFromSync(a){for(let b in a)DBHelper.createSyncPost(b,"http://localhost:1337/reviews/")}static postReview(a){DBHelper.createPost(a,"http://localhost:1337/reviews/")}static updateReview(a,b){DBHelper.createPost(a,`http://localhost:1337/reviews/${b}`)}static createPost(a,b){console.log("Creating post body"),fetch(b,{method:"post",body:JSON.stringify(a)}).then(function(c){return c.json()}).then(function(c){console.log("Created Post Body:",c)}).then(function(){console.log("Calling clearSyncStore"),DBHelper.clearSyncStore()})}static favoriteRestaurant(a){DBHelper.createPost({},`http://localhost:1337/restaurants/${a}/?is_favorite=true`)}static unFavoriteRestaurant(a){DBHelper.createPost({},`http://localhost:1337/restaurants/${a}/?is_favorite=false`)}static fetchReviews(a,b){fetch(`http://localhost:1337/reviews?restaurant_id=${a}`).then(c=>c.json()).then(c=>{return console.log(c,"review response"),DBHelper.insertDataToDB(c),c}).then(c=>b(null,c)).catch(c=>{console.log("Something went wrong!: ",c),b(c,null)})}static fetchReviewsById(a,b){DBHelper.fetchReviews(a,(c,d)=>{c?b(c,null):d?b(null,d):b("Review does not exist",null)})}static fetchRestaurants(a){fetch(DBHelper.DATABASE_URL).then(b=>b.json()).then(b=>{return console.log(b),DBHelper.insertDataToDB(b),b}).then(b=>a(null,b)).catch(b=>{console.log("Something went wrong!: ",b),a(b,null)})}static insertDataToDB(a){let b=idb.open(DBHelper.DB_NAME,DBHelper.DB_VERSION,function(c){switch(c.oldVersion){case 0:c.createObjectStore("restaurants",{keyPath:"id"});case 1:c.createObjectStore("reviews",{keyPath:"id",autoIncrement:!0});case 2:c.createObjectStore("sync-reviews",{keyPath:"id",autoIncrement:!0});}});a[0].comments?b.then(function(c){let d=c.transaction("reviews","readwrite"),e=d.objectStore("reviews");console.log(e.autoIncrement);for(let g of a)e.put(g);return d.complete}).then(function(){console.log("added reviews!")}):b.then(function(c){let d=c.transaction("restaurants","readwrite"),e=d.objectStore("restaurants");for(let g of a)e.put(g);return d.complete}).then(function(){console.log("added restaurants!")})}static insertOfflineReview(a){let b=idb.open(DBHelper.DB_NAME,DBHelper.DB_VERSION);b.then(function(c){let d=c.transaction("sync-reviews","readwrite"),e=d.objectStore("sync-reviews");return console.log(a),e.put(a),d.complete}).then(function(){console.log("added review to sync-review objectstore!")})}static syncReviewsFromDatabase(){let a=idb.open(DBHelper.DB_NAME,DBHelper.DB_VERSION);a.then(function(b){let c=b.transaction("sync-reviews","readwrite"),d=c.objectStore("sync-reviews");return d.getAll()}).then(function(b){if(console.log("got all sync-reviews!",b),console.log("sync reviews length",b.length),0>=b.length)console.log("sync reviews is empty",b);else if(2<=b.length){let c=b.slice(0);console.log(c),console.log("starting loop");for(let d of c)DBHelper.postReview(d)}else console.log("called postreview with one review"),DBHelper.postReview(b[0])})}static clearSyncStore(){let a=idb.open(DBHelper.DB_NAME,DBHelper.DB_VERSION);a.then(function(b){let c=b.transaction("sync-reviews","readwrite"),d=c.objectStore("sync-reviews");return d.clear(),c.complete}).then(function(b){console.log("deleted entries in objectstore sync-reviews!",b)})}static fetchRestaurantById(a,b){DBHelper.fetchRestaurants((c,d)=>{if(c)b(c,null);else{const e=d.find(f=>f.id==a);e?b(null,e):b("Restaurant does not exist",null)}})}static fetchRestaurantByCuisine(a,b){DBHelper.fetchRestaurants((c,d)=>{if(c)b(c,null);else{const e=d.filter(f=>f.cuisine_type==a);b(null,e)}})}static fetchRestaurantByNeighborhood(a,b){DBHelper.fetchRestaurants((c,d)=>{if(c)b(c,null);else{const e=d.filter(f=>f.neighborhood==a);b(null,e)}})}static fetchRestaurantByCuisineAndNeighborhood(a,b,c){DBHelper.fetchRestaurants((d,e)=>{if(d)c(d,null);else{let f=e;"all"!=a&&(f=f.filter(g=>g.cuisine_type==a)),"all"!=b&&(f=f.filter(g=>g.neighborhood==b)),c(null,f)}})}static fetchNeighborhoods(a){DBHelper.fetchRestaurants((b,c)=>{if(b)a(b,null);else{const d=c.map((f,g)=>c[g].neighborhood),e=d.filter((f,g)=>d.indexOf(f)==g);a(null,e)}})}static fetchCuisines(a){DBHelper.fetchRestaurants((b,c)=>{if(b)a(b,null);else{const d=c.map((f,g)=>c[g].cuisine_type),e=d.filter((f,g)=>d.indexOf(f)==g);a(null,e)}})}static urlForRestaurant(a){return`./restaurant.html?id=${a.id}`}static imageUrlForRestaurant(a){return`/img/${a.id}.jpg`}static imageSrcsetUrlForRestaurant(a){return`/img_dist/${a.id}-400-small.jpg 400w, /img_dist/${a.id}-800-medium.jpg 800w, /img_dist/${a.id}-1600-large.jpg 1600w`}static mapMarkerForRestaurant(a,b){const c=new google.maps.Marker({position:a.latlng,title:a.name,url:DBHelper.urlForRestaurant(a),map:b,animation:google.maps.Animation.DROP});return c}}