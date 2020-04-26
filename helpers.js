
//email look up function
const emailLookUp = function(email, database) {
  //search through users to see if email entered is already registered
  for (let key in database) {
    //if the email given is in the users object database
    //return the id that is associated with that specific user
    if (email === database[key]['email']) {
      return database[key]['id'];
    }
  }
  return false;
};

//searching if the cookieid is equal to a user's ID in the users database
const idWithCookie = function(cookieid, database) {
  //loop through the users object to compare cookieID to a users ID
  for (let key in database) {
    //if the cookieID and usersID are equal return that users ID
    if (cookieid === database[key]['id']) {
      return database[key]['id'];
    }
  }
  return false;
};

//need to compare cookie usersId with the user id in the url database
const urlsForUser = function(id, database) {
  //want to store the urls for that user
  const usersUrl = {};
  //loop through the shortURL keys in the  urldatabase
  for (let key in database) {
    //if the current cookieID is equal to the userID of the added url
    if (id === database[key]['userID']) {
      //add the whole shortURL object into the usersUrl in case they have multiple urls
      usersUrl[key] = database[key];
    }
  }
  return usersUrl;
};

//check if the short url is equal to one the the short urls in the users urls
const checkShortUrl = function(shortUrl, urlsForUser) {
  //loop through the users urls
  for (let key in urlsForUser) {
    //if the short url is equal to the short url in the users urls
    if (shortUrl === key) {
      return true;
    }
  }
};

//check if the short url exists in the database
const checkShortUrlDatabase = function(shortUrl, urlDatabase) {
  //loop through the users urls
  for (let key in urlDatabase) {
    //if the short url exist in database
    if (shortUrl === key) {
      return true;
    }
  }
};

module.exports = {emailLookUp, checkShortUrl, urlsForUser, idWithCookie, checkShortUrlDatabase};