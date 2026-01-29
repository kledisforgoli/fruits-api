const input = document.getElementById("fruitInput");
const result = document.getElementById("fruitResult");

const url = "https://fruityvice.com/api/fruit/all";
const proxy = "https://api.allorigins.win/get?url=" + encodeURIComponent(url);

let cachedFruits = null;
let lastQuery = "";

input.addEventListener("input", () => {
   const q = input.value.trim();
   lastQuery = q;
   debounceSearch(q);
});

let t = null;

function debounceSearch(q) {
   clearTimeout(t);
   t = setTimeout(() => searchFruit(q), 300);
}

async function getAllFruits() {
   if (cachedFruits) return cachedFruits;

   const response = await fetch(proxy);
   if (!response.ok) throw new Error("Error");

   const data = await response.json();
   cachedFruits = JSON.parse(data.contents);
   return cachedFruits;
}

function clearResult() {
   result.replaceChildren();
}

function makeLine(label, value) {
   const p = document.createElement("p");
   const strong = document.createElement("strong");
   strong.textContent = `${label}: `;
   p.appendChild(strong);
   p.appendChild(document.createTextNode(value ?? ""));
   return p;
}

function renderFruitCard(fruit) {
   const card = document.createElement("div");
   card.className = "fruit-card"

   card.appendChild(makeLine("Name", fruit.name));
   card.appendChild(makeLine("Family", fruit.family));
   card.appendChild(makeLine("Order", fruit.order));
   card.appendChild(makeLine("Genus", fruit.genus));

   const nutritionTitle = document.createElement("p");
   const nutritionStrong = document.createElement("strong");
   nutritionStrong.textContent = "Nutrition:";
   nutritionTitle.appendChild(nutritionStrong);
   card.appendChild(nutritionTitle);

   const n = fruit.nutritions || {};
   card.appendChild(makeLine("Calories", String(n.calories ?? "")));
   card.appendChild(makeLine("Sugar", String(n.sugar ?? "")));
   card.appendChild(makeLine("Carbohydrates", String(n.carbohydrates ?? "")));
   card.appendChild(makeLine("Protein", String(n.protein ?? "")));
   card.appendChild(makeLine("Fat", String(n.fat ?? "")));

   return card;
}

async function searchFruit(text) {
   clearResult();

   if (!text) return;

   try {
      const fruits = await getAllFruits();

      if (text !== lastQuery) return;

      const search = text.toLowerCase();

      const matches = fruits.filter((f) => {
         return (
            f.name?.toLowerCase().includes(search) ||
            f.family?.toLowerCase() === search ||
            f.order?.toLowerCase() === search ||
            f.genus?.toLowerCase() === search
         );
      });

      clearResult();

      if (matches.length === 0) {
         const p = document.createElement("p");
         p.textContent = "Nuk u gjet fruti";
         result.appendChild(p);
         return;
      }

      const fragment = document.createDocumentFragment();
      matches.forEach((fruit) => fragment.appendChild(renderFruitCard(fruit)));
      result.appendChild(fragment);
      
   } catch (err) {
      clearResult();
      const p = document.createElement("p");
      p.textContent = "Error";
      result.appendChild(p);
      console.error(err);
   }
}