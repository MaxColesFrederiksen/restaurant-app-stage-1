let restaurant;
var map;
let status;


/**
 * Initialize Google map, called from HTML.
 */


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


window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.log('something');
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      // DBHelper.lazyLoadImages();
      // fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}





/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
    DBHelper.fetchReviewsById(id, (error, reviews) => {
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML(reviews)
    })
  }
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  // image.className = 'cld-responsive'
  image.className += 'lazy';
  image.className += ' restaurant-img'
  image.src = `/img/placeholder-img.jpg`
  image.srcset = `/img_dist/placeholder-img-400-small.jpg 400w, /img_dist/placeholder-img-800-medium.jpg 800w, img_dist/placeholder-img-1600-large.jpg 1600w,`
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
  image.setAttribute("data-srcset", DBHelper.imageSrcsetUrlForRestaurant(restaurant))
  image.alt = `Picture of the restaurant called ${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill favorite button
  fillFavoriteHTML();
  // fill reviews
  fillReviewsHTML();

  addFavoriteListener();
  addFormListener(restaurant);

  DBHelper.lazyLoadImages();
  
  
  


}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);

  }
}

fillFavoriteHTML = () => {
  const restaurantContainer = document.getElementById("restaurant-container");

  const favorite = document.createElement('i');
  favorite.className = 'favorite';
  favorite.setAttribute('favorite-restaurant', self.restaurant.id);
  if (self.restaurant.is_favorite == "true") {

    favorite.className += ' favorited';
  } else {
    favorite.className = 'favorite';
  }

  restaurantContainer.appendChild(favorite);
  
  const h6 = document.createElement('h6');
  h6.innerText = 'Favorite';

  restaurantContainer.appendChild(h6);

  return;
}

/**
 * Create all reviews HTML and add them to the webpage.
 */

fillReviewsHTML = (reviews) => {

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  
  if (!reviews) {
    console.log('no reviews');
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.className = 'no-reviews';
    container.appendChild(noReviews);
    return;
  }
  const noReviewsEl = document.querySelector('.no-reviews');
  container.removeChild(noReviewsEl);
  container.removeChild(title);
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const bar = document.createElement('div');
  bar.className = 'review-bar';
  const name = document.createElement('p');
  name.innerHTML = review.name;
  const date = document.createElement('p');

  let d = new Date(review.createdAt);
  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];


  date.innerHTML = `${d.getDate() > 3 ? d.getDate() + 'th' : d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()} `;
  
  if (d.getDate() == 3) {

    date.innerHTML = `${d.getDate()}rd ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }
  
  if (d.getDate() == 2) {
    date.innerHTML = `${d.getDate()}nd ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }

  if (d.getDate() == 1) {
    date.innerHTML = `${d.getDate()}st ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }
  
  bar.appendChild(name);
  bar.appendChild(date);
  li.appendChild(bar);
  
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
// fillBreadcrumb = (restaurant=self.restaurant) => {
//   const breadcrumb = document.getElementById('breadcrumb');
//   const li = document.createElement('li');
//   li.innerHTML = restaurant.name;
//   breadcrumb.appendChild(li);
// }

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


// Plugins

$("#rating").rateYo({
  rating: 2,
  fullStar: true,
  onSet: function (rating, rateYoInstance) {
    console.log(rating);
  }
});


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

    fav.classList.toggle('favorited');


     console.log(hasClass(fav, 'favorited'))
      // console.log($("#rating").rateYo("rating"));
    })
  })
}


window.addEventListener('load', function() {
  function updateOnlineStatus(event) {
    var condition = navigator.onLine ? "online" : "offline";
    status = condition;
    
    if (status === 'online') {
      DBHelper.syncReviewsFromDatabase()
    }
  }
  
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

addFormListener = (restaurant) => {
  const submit = document.querySelector('.review-submit');
  const nameInput = document.querySelector('.review-name');
  const commentTextarea = document.querySelector('.review-comment');

  submit.addEventListener('click', function(e){
    e.preventDefault();

    let id = restaurant.id;
    let name = nameInput.value;
    let rating = $("#rating").rateYo("rating");
    let comment = commentTextarea.value;

    let reviewObj = [{
      "restaurant_id": id,
      "name": name,
      "rating": rating,
      "comments": comment
    }]
    
    // Check if user is offline or online before submitting
    // if user is online send review as normal
    // Else send the review to the database
    // And notify user that the review will update once the re-connect to internet
    if (status !== 'online') {
      console.log(reviewObj)

      DBHelper.insertOfflineReview(reviewObj)
      alert('Your review has been saved, and will be submitted once your are connected to the internet')
    } else {
      DBHelper.postReview(reviewObj);
    }



    
    
  });
}

hasClass = (element, className) => {
    return element.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className);
}

