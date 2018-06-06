let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});



toggle_map = () => {
    if (document.getElementById('map').style.display === 'none')
      document.getElementById('map').style.display = 'block'
    else
      document.getElementById('map').style.display = 'none'
  }

swap_map = () => {
    if (document.getElementById('map').style.display === 'none')
      {
        document.getElementById('map').style.display = 'block'
        document.getElementById('static_map').style.display = 'none'
      }
  }



/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
 
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  // addMap();
  addMarkersToMap();
  addFavoriteListener();
  DBHelper.lazyLoadImages(restaurants);
  // if (document.querySelector('.card')) {
  //   DBHelper.responsiveImages();
  // }

}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const card = document.createElement('div');
  card.className = 'card';
  

  const image = document.createElement('img');
  // image.className = 'cld-responsive'
  image.className += 'lazy';
  image.className += ' restaurant-img'
  image.src = `/img/placeholder-img.jpg`
  image.srcset = `/img_dist/placeholder-img-400-small.jpg 400w, /img_dist/placeholder-img-800-medium.jpg 800w, img_dist/placeholder-img-1600-large.jpg 1600w,`
  // srcset dynamic
  // Set placeholder image srcset
  // then change it with {restaurant.id} in the interactionObserver


  // image.src = 'http://res.cloudinary.com/dpehzqvvx/image/upload/placeholder-img.jpg' // Use placeholder image
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant))
  image.setAttribute("data-srcset", DBHelper.imageSrcsetUrlForRestaurant(restaurant))
  image.alt = `Picture from the restaurant called ${restaurant.name}`;
  card.append(image);
  li.append(card);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  card.append(name);
  li.append(card);

  const lineBreaker = document.createElement('div');
  lineBreaker.className = 'line-breaker';
  card.append(lineBreaker);
  li.append(card);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  card.append(neighborhood);
  li.append(card);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  card.append(address);
  li.append(card);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  card.append(more);
  li.append(card);

  const favorite = document.createElement('i');
  favorite.className = 'favorite';
  favorite.setAttribute('favorite-restaurant', restaurant.id);
  
  if (restaurant.is_favorite == "true") {
    favorite.className += ' favorited';
  } else {
    favorite.className = 'favorite';
  }
  card.append(favorite);
  li.append(card);
  
  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}




addFavoriteListener = () => {
  const favorite = document.querySelectorAll('.favorite');

  favorite.forEach(function(fav) {
    fav.addEventListener('click', function () {
    
    // On click of favorite
    // if not fav call setFavoriteRestaurant
    //else call unFavoriteRestaurant
    if (!hasClass(fav, 'favorited')) {
      let id = fav.getAttribute("favorite-restaurant");
      DBHelper.favoriteRestaurant(id);
      
    } else {
      let id = fav.getAttribute("favorite-restaurant");
      DBHelper.unFavoriteRestaurant(id);

    }


    // ** Maybe use api favorite boolean value to add class "favortied" to heart before rendered ** 

    fav.classList.toggle('favorited');


     console.log(hasClass(fav, 'favorited'))
      // console.log($("#rating").rateYo("rating"));
    })
  })
}


hasClass = (element, className) => {
    return element.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className);
}