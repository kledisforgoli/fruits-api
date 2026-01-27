var input = document.getElementById("fruitInput");
var result = document.getElementById("fruitResult");

input.addEventListener("input", function () {
  searchFruit(input.value);
});

function searchFruit(text) {

  if (text === "") {
    result.innerHTML = "";
    return;
  }

  var url = "https://fruityvice.com/api/fruit/all";
  var proxy =
    "https://api.allorigins.win/get?url=" + encodeURIComponent(url);

  fetch(proxy)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {

      var fruits = JSON.parse(data.contents);
      var found = false;
      var html = "";

      for (var i = 0; i < fruits.length; i++) {

        var search = text.toLowerCase();

        if (
          fruits[i].name.toLowerCase() === search ||
          fruits[i].family.toLowerCase() === search ||
          fruits[i].order.toLowerCase() === search ||
          fruits[i].genus.toLowerCase() === search
        ) {

          found = true;

          html += "<strong>Name:</strong> " + fruits[i].name + "<br>";
          html += "<strong>Family:</strong> " + fruits[i].family + "<br>";
          html += "<strong>Order:</strong> " + fruits[i].order + "<br>";
          html += "<strong>Genus:</strong> " + fruits[i].genus + "<br>";
          html += "<strong>Nutrition:</strong><br>";

          html += "Calories: " + fruits[i].nutritions.calories + "<br>";
          html += "Sugar: " + fruits[i].nutritions.sugar + "<br>";
          html += "Carbohydrates: " + fruits[i].nutritions.carbohydrates + "<br>";
          html += "Protein: " + fruits[i].nutritions.protein + "<br>";
          html += "Fat: " + fruits[i].nutritions.fat + "<br><hr>";
        }
      }

      if (found === false) {
        result.innerHTML = "Nuk u gjet fruti";
      } else {
        result.innerHTML = html;
      }

    })
    .catch(function () {
      result.innerHTML = "Error";
    });
}
