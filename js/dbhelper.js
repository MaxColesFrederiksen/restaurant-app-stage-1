/**
 * Common database helper functions.
 */
class DBHelper {

  

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DB_NAME() {
    let DB_NAME = 'db-v5'
    return DB_NAME;
  }

  static get DB_VERSION() {
    let DB_VERSION = 5
    return DB_VERSION;
  }



  static lazyLoadImages(restaurants) {
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  
  
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          
          if (entry.target.id === 'static_map') {
            let staticMap = entry.target;
            
            document.getElementById('map').style.display = 'block'
            document.getElementById('static_map').style.display = 'none'
            staticMap.classList.remove("lazy");
            lazyImageObserver.unobserve(staticMap);
          } else {
            let lazyImage = entry.target;
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.srcset = lazyImage.dataset.srcset;
            lazyImage.classList.remove("lazy");
            lazyImageObserver.unobserve(lazyImage);
          }
          
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
  }
}


  /**
   * Post a review
   */
   static postReviewsFromSync(reviewObj) {
    for (let review in reviewObj) {
      DBHelper.createSyncPost(review, 'http://localhost:1337/reviews/');
    }
   }
   // static putReview(reviewObj, id) {
   //  // console.log(JSON.stringify(reviewObj))
   //  DBHelper.createPost(reviewObj, `http://localhost:1337/reviews/${id}`);
   // }
   // static postReviewFromSync(reviewObj) {
   //  DBHelper.createSyncPost(reviewObj, 'http://localhost:1337/reviews/');
   // }

   static postReview(reviewObj) {
    // console.log(JSON.stringify(reviewObj))
    DBHelper.createPost(reviewObj, 'http://localhost:1337/reviews/');
   }

   static updateReview(reviewObj, id) {
    
    DBHelper.createPost(reviewObj, `http://localhost:1337/reviews/${id}`);

   }

  //  static createSyncPost(opts, url) {
  //   console.log('Creating post body');
  //   fetch(url, {
  //     method: 'post',
  //     body: JSON.stringify(opts)
  //   }).then(function(response) {
  //     return response.json();
  //   }).then(function(data) {
  //     console.log('Created Post Body:', data);
  //     // DBHelper.clearSyncStore();
  //   });
  // }

  static createPost(opts, url) {
    console.log('Creating post body');
    fetch(url, {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log('Created Post Body:', data);
      window.location.reload(true);
    }).then(function(){
      console.log('Calling clearSyncStore');
      DBHelper.clearSyncStore();
    })
  }

  static createPut(opts, url, id) {
    console.log('Creating post body');
    fetch(url, {
      method: 'put',
      body: JSON.stringify(opts)
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log('Created Post Body:', data);
      // window.location.reload(true);
    }).then(function(){
      console.log('Calling clearSyncStore');
      DBHelper.clearSyncStore();
    })
  }

  static favoriteDatabase(id, val) {

    let dbPromise = idb.open(DBHelper.DB_NAME, DBHelper.DB_VERSION)

      dbPromise.then(function(db) {
        let tx = db.transaction('restaurants', 'readwrite');
        let store = tx.objectStore('restaurants');

        
        store.iterateCursor(cursor => {
          if (!cursor) return;
          if (cursor.value.id == id) {
            // change favorite to val
            // cursor.value.is_favorite = val;
            console.log(cursor.value);
            cursor.value.is_favorite = val;
            console.log(cursor.value)
          }
          
          
          cursor.continue();
        });
        

        return tx.complete;
      }).then(function() {
        console.log('cursor is finished!');
      });

  }

   static favoriteRestaurant(id) {
    DBHelper.createPut({}, `http://localhost:1337/restaurants/${id}/?is_favorite=true`, id);
    // also update indexdb data
    // second arg is true because it's used in favorite
    DBHelper.favoriteDatabase(id, true);
   }

  static unFavoriteRestaurant(id) {
    DBHelper.createPut({}, `http://localhost:1337/restaurants/${id}/?is_favorite=false`, id);
    DBHelper.favoriteDatabase(id, false);
  }

  static fetchReviews(id, callback) {
    fetch(`http://localhost:1337/reviews?restaurant_id=${id}`)
      .then(response => response.json())
      .then((reviewsResponse) => {
        console.log(reviewsResponse, 'review response');
        DBHelper.insertDataToDB(reviewsResponse)
        return reviewsResponse
      })
      .then(reviewsResponse => callback(null, reviewsResponse))
      .catch(err => {
        console.log('Something went wrong!: ', err);
        callback(err, null);
      }
    );
  }

  // static deleteReviews(id) {
  //     return fetch(`http://localhost:1337/reviews/${id}`, {
  //       method: 'delete'
  //     })
  //     .then(response => console.log(response.json()));
  //   }
  // }

    static fetchReviewsById(id, callback) {
    // fetch all reviews with proper error handling.
    DBHelper.fetchReviews(id, (error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        if (reviews) { // Got the restaurant
          callback(null, reviews);
        } else { // Restaurant does not exist in the database
          callback('Review does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch all restaurants.
   */


  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then((restaurants) => {
        console.log(restaurants)
        DBHelper.insertDataToDB(restaurants) // insert a fresh copy from server into indexeddb
        return restaurants
      })
      .then(restaurants => callback(null, restaurants))
      .catch(err => {
        // Fetch from indexdb when network is not available
        console.log('Something went wrong!: ', err);
        callback(err, null);
      }
    );
  }

   static insertDataToDB(data) {

      let dbPromise = idb.open(DBHelper.DB_NAME, DBHelper.DB_VERSION, function(upgradeDb) {
        switch(upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore('restaurants' ,{keyPath: 'id'});
          case 1:
            upgradeDb.createObjectStore('reviews' ,{ keyPath: 'id', autoIncrement: true});
          case 2:
            upgradeDb.createObjectStore('sync-reviews' ,{ keyPath: 'id', autoIncrement: true});
          }
      });
      
      // if data is reviews
      if (data[0].comments) {

          dbPromise.then(function(db) {
            let tx = db.transaction('reviews', 'readwrite');
            let store = tx.objectStore('reviews');
            
            let reviews = data;

            console.log(store.autoIncrement)

            for (let review of reviews) {
              store.put(review);
            }

            return tx.complete;
          }).then(function() {
            console.log('added reviews!');
          });

      } else {

        dbPromise.then(function(db) {
        let tx = db.transaction('restaurants', 'readwrite');
        let store = tx.objectStore('restaurants');

        let restaurants = data;
      
        for (let restaurant of restaurants) {
          // console.log(restaurant)
          store.put(restaurant);
        }
        
        return tx.complete;
      }).then(function() {
        console.log('added restaurants!');
      });

      }

   }

  static insertOfflineReview(review) {
    
      let dbPromise = idb.open(DBHelper.DB_NAME, DBHelper.DB_VERSION)

      dbPromise.then(function(db) {
        let tx = db.transaction('sync-reviews', 'readwrite');
        let store = tx.objectStore('sync-reviews');

        console.log(review);
        store.put(review);
        

        return tx.complete;
      }).then(function() {
        console.log('added review to sync-review objectstore!');
      });
      // switch statement
      // create objectstore 'sync-reviews'
      // post reviews to objectstore



  }


  static syncReviewsFromDatabase() {

      // Sync reviews from sync-reviews
      // then post reviews to server

      let dbPromise = idb.open(DBHelper.DB_NAME, DBHelper.DB_VERSION);

      dbPromise.then(function(db) {
        let tx = db.transaction('sync-reviews', 'readwrite');
        let store = tx.objectStore('sync-reviews');

        return store.getAll();
      }).then(function(val) {
        
        console.log('got all sync-reviews!', val)
        console.log('sync reviews length', val.length)
        
        if (val.length <= 0) {
          console.log('sync reviews is empty', val)
        } else {
          
          // if reviews is more than or equal to two
          if (val.length >= 2) {

            let reviewsArrayClone = val.slice(0);
            console.log(reviewsArrayClone);

            // loop through all reviews in clone -> call postReview them
            console.log('starting loop');
            for (let review of reviewsArrayClone) {
              DBHelper.postReview(review);
            }
            
          } else {
            // if only one review
            console.log('called postreview with one review')
            DBHelper.postReview(val[0]);
          }
        
        }
      })

  }

  static clearSyncStore() {
    let dbPromise = idb.open(DBHelper.DB_NAME, DBHelper.DB_VERSION);

     dbPromise.then(function(db) {
        let tx = db.transaction('sync-reviews', 'readwrite');
        let store = tx.objectStore('sync-reviews');
        
        store.clear();

        return tx.complete;
      }).then(function(val) {
        console.log('deleted entries in objectstore sync-reviews!', val)
      })
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {

        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }
  
  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
    // return (`http://res.cloudinary.com/dpehzqvvx/image/upload/c_scale,w_auto/${restaurant.id}.jpg`)
  }

  static imageSrcsetUrlForRestaurant(restaurant) {
    return (`/img_dist/${restaurant.id}-400-small.jpg 400w, /img_dist/${restaurant.id}-800-medium.jpg 800w, /img_dist/${restaurant.id}-1600-large.jpg 1600w`)
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
