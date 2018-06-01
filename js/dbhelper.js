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

  // static responsiveImages() {
  //     console.log('called responsive images')
  //     var cl = cloudinary.Cloudinary.new({cloud_name: "dpehzqvvx"}); 
  //     // replace 'demo' with your cloud name in the line above 
  //     cl.responsive();
  // }

  static lazyLoadImages(restaurants) {
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  
  console.log('lazyImages', restaurants);
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          
          if (entry.target.id === 'static_map') {
            let staticMap = entry.target;
            console.log(staticMap);
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

   static postReview(reviewObj) {
    // console.log(JSON.stringify(reviewObj))
    DBHelper.createPost(reviewObj, 'http://localhost:1337/reviews/');
   }

   static updateReview(reviewObj, id) {
    
    DBHelper.createPost(reviewObj, `http://localhost:1337/reviews/${id}`);
   }



  static createPost(opts, url) {
    console.log('Creating post body');
    fetch(url, {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log('Created Post Body:', data);
    });
  }



   static favoriteRestaurant(id) {
  
    DBHelper.createPost({}, `http://localhost:1337/restaurants/${id}/?is_favorite=true`);
     
   }

  static unFavoriteRestaurant(id) {
    DBHelper.createPost({}, `http://localhost:1337/restaurants/${id}/?is_favorite=false`);
  }

  static fetchReviews(id, callback) {
    fetch(`http://localhost:1337/reviews?restaurant_id=${id}`)
      .then(response => response.json())
      .then((reviewsResponse) => {
        console.log(reviewsResponse);
        DBHelper.insertRestaurantsToDB(reviewsResponse)
        return reviewsResponse
      })
      .then(reviewsResponse => callback(null, reviewsResponse))
      .catch(err => {
        console.log('Something went wrong!: ', err);
        callback(err, null);
      }
    );

  }



  /**
   * Fetch all restaurants.
   */


  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .then((restaurants) => {
        console.log(restaurants)
        DBHelper.insertRestaurantsToDB(restaurants) // insert a fresh copy from server into indexeddb
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

   static insertRestaurantsToDB(restaurants) {
      let DB_NAME = 'db-v4'

      let dbPromise = idb.open(DB_NAME, 4, function(upgradeDb) {
        switch(upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore('restaurants' ,{keyPath: 'id'});
          case 1:
            upgradeDb.createObjectStore('reviews' ,{keyPath: 'restaurant_id'});
          }
      });

      dbPromise.then(function(db) {
        let tx = db.transaction('restaurants', 'readwrite');
        let store = tx.objectStore('restaurants');
        
      
        for (let restaurant of restaurants) {
          // console.log(restaurant)
          store.put(restaurant);
        }
        
        return tx.complete;
      }).then(function() {
        console.log('added restaurants!');
      });

      dbPromise.then(function(db) {
        let tx = db.transaction('reviews', 'readwrite');
        let store = tx.objectStore('reviews');
        
        for (let restaurant of restaurants) {
          
          let reviews = restaurant.reviews;
          console.log(reviews)
          store.put({restaurant_id: restaurant.id, reviews: reviews});
        }

        return tx.complete;
      }).then(function() {
        console.log('added reviews!');
      });

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
