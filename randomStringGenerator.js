//display six random characters into a string for the short url
const generateRandomString = function() {
  let newRandomString = "";
  for (let i = 0; i < 6; i++) {
    newRandomString += randomCharacter();
  }
  return newRandomString;
};
//create a random string for the short url
const randomCharacter = function() {
  let chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
  return chars.substr(Math.floor(Math.random() * 62), 1);
};

module.exports = generateRandomString();