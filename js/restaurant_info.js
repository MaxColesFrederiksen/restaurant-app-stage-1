let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
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
  image.className = 'cld-responsive'
  image.className += ' restaurant-img'
  image.className += ' lazy';
  //only call the cloudinary responsive function if the image is in view
  // Using the intersectionObserver
  image.src = 'http://res.cloudinary.com/dpehzqvvx/image/upload/placeholder-img.jpg' // Use placeholder image
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
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

 // DBHelper.fetchReviews(self.restaurant.id)

fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  console.log(reviews)

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
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
  date.innerHTML = review.date;
  
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

    let reviewObj = {
      "restaurant_id": id,
      "name": name,
      "rating": rating,
      "comments": comment
    }
    // DBHelper.postReview(reviewObj);
    DBHelper.updateReview(reviewObj, id);
  });
}

hasClass = (element, className) => {
    return element.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className);
}

