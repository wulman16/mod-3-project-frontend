let USER_NAME, USER_ID, GIF_ID;

document.addEventListener("DOMContentLoaded", () => {
  const signInDialog = document.getElementById("sign-in-dialog")
  if (typeof signInDialog.showModal === "function") {
    signInDialog.showModal()
  } else {
    alert("The dialog API is not supported by this browser")
  }
  const userForm = document.getElementById("sign-in")
  userForm.addEventListener('submit', userSignIn)

  const sortDropdown = document.getElementById('sort-dropdown')
  sortDropdown.addEventListener('change', sortGifs)

  const list = document.getElementById("gif-list");
  list.addEventListener("click", handleThumbnailClick);

  const form = document.getElementById("new-gif-form");
  form.addEventListener("submit", handleGifSubmission);

  window.addEventListener('click', e => {
    // console.log(e.target.id)
    if (e.target.id === "detail-dialog") {
      document.getElementById('detail-dialog').close();
    }
  })
});

/**
 *
 * @summary this section is for event handlers
 */

function userSignIn(e) {
  e.preventDefault();
  document.getElementById('sign-in-dialog').close()
  const name = e.target.elements["name"].value

  return Adapter.create('users', { name })
  .then(json => {
    if (json.errors) {
      userSignIn();
    } else {
      USER_NAME = json.name;
      USER_ID = json.id;
      document.getElementById("greeting").textContent = `Welcome, ${json.name}.`
      document.querySelectorAll('.to-show').forEach(div => div.style.display="block")

      Gif.renderAll()
    }
  });
}

function handleThumbnailClick(e) {
  if (e.target.tagName === "IMG") {
    const id = e.target.dataset.id

    Adapter.get('gifs', id).then(renderDetails)
  }
}

function handleGifSubmission(e) {
  e.preventDefault();
  const title = e.target.elements["title"].value;
  const url = e.target.elements["url"].value;
  const postBody = { title, url };

  Adapter.create('gifs', postBody)
    .then(Gif.renderAll)
    .catch(() => alert("That GIF has already been added."));
}

function sortGifs(e) {
  const selection = e.target.value
  const gifs = document.getElementById('gif-list')
  gifs.innerHTML = ''
  switch (selection) {
    case 'best':
      fetchSortedGifs(propertyComparator('avg_rating', 'descending'))
      break;
    case 'worst':
      fetchSortedGifs(propertyComparator('avg_rating', 'ascending'))
      break;
    case 'newest':
      fetchSortedGifs(propertyComparator('created_at', 'descending'))
      break;
    case 'oldest':
      fetchSortedGifs(propertyComparator('created_at', 'ascending'))
      break;
  }
}

/**
 * TODO:
 * @todo move these into separate class
 */

function renderDetails(data) {
  GIF_ID = data.id;

  const detailDialog = document.getElementById('detail-dialog')
  const close = document.getElementById('exit-dialog')
  close.addEventListener('click', e => {
    detailDialog.close();
  })

  if (typeof detailDialog.showModal === "function") {
    detailDialog.showModal()
  } else {
    alert("The dialog API is not supported by this browser")
  }

  const gifDetails = document.getElementById("gif-details");
  gifDetails.innerHTML = "";

  const title = document.createElement("h3");
  title.className = 'details-title'
  title.textContent = data.title;
  gifDetails.append(title);

  const avgRating = document.createElement("h3");
  avgRating.className = 'details-avg-rating'
  avgRating.textContent = `Average Rating: ${parseFloat(data.avg_rating).toFixed(1)} stars`;
  if (data.reviews.length > 0) {
    gifDetails.append(avgRating);
  }

  const gif = document.createElement("img");
  gif.src = data.url;
  gif.className = "gif-detail";
  gifDetails.append(gif);

  const reviewFormContainer = document.getElementById('review-form-container')
  reviewFormContainer.innerHTML = "";
  reviewFormContainer.append(ReviewForm.render())

  // const reviewButton = document.createElement('button')
  // reviewButton.innerText = "Add Review"
  // reviewButton.addEventListener('click', handleReviewButtonClick)
  // gifDetails.append(reviewButton)
  // renderReviewForm();

  // return data;
  Review.renderAll();
}

function ratingToStars(rating) {
  let stars = ''
  for(let i = rating; i > 0; i--) {
    stars += '\u2605'
  }
  let nonStars = 5 - rating
  for(let i = nonStars; i > 0; i--) {
    stars += '\u2606'
  }
  return stars
}

function propertyComparator(prop, order) {
  if (order === 'ascending') {
    return function(a, b) {
      return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0
    }
  } else if (order === 'descending') {
    return function(a, b) {
      return a[prop] > b[prop] ? -1 : a[prop] < b[prop] ? 1 : 0
    }
  }
}

function fetchSortedGifs(sortFunction) {
  Adapter.get(GIFS_ENDPOINT)
    .then(data => data.sort(sortFunction))
    .then(sorted => sorted.forEach(gif => Gif.renderThumbnail(gif)))
}
