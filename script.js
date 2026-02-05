const input = document.getElementById("fruitInput");
const result = document.getElementById("fruitResult");
const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");
const andMode = document.getElementById("andMode");
const orMode = document.getElementById("orMode");

const url = "https://fruityvice.com/api/fruit/all";
const proxy = "https://api.allorigins.win/get?url=" + encodeURIComponent(url);

let cachedFruits = null;
let lastQuery = "";


filterBtn.addEventListener("click", () => {
   filterPanel.classList.toggle("hidden");
   filterBtn.classList.toggle("active");
});


andMode.addEventListener("change", () => {
   if (input.value.trim()) {
      searchFruit(input.value.trim());
   }
});

orMode.addEventListener("change", () => {
   if (input.value.trim()) {
      searchFruit(input.value.trim());
   }
});

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

function parseSearchTerms(text) {
   let mode;
   let terms = [];

   if (text.includes('&&')) {
      mode = 'AND';
      terms = text.split('&&').map(t => t.trim()).filter(t => t);
      andMode.checked = true;
   } else if (text.includes('||')) {
      mode = 'OR';
      terms = text.split('||').map(t => t.trim()).filter(t => t);
      orMode.checked = true;
   } else {
      mode = andMode.checked ? 'AND' : 'OR';

      if (text.includes(':') || text.match(/starts\s+with/i)) {
         terms = [text];
      } else {
         terms = text.split(/\s+/).map(t => t.trim()).filter(t => t);
      }
   }

   return {
      mode,
      terms
   };
}

function fruitMatchesTerm(fruit, term) {
   const trimmedTerm = term.trim();


   const propertyMatch = trimmedTerm.match(/^(\w+)\s*:\s*(.+)$/);
   if (propertyMatch) {
      const property = propertyMatch[1].toLowerCase();
      const value = propertyMatch[2].trim();


      let propValue = '';
      if (property === 'calories' || property === 'sugar' ||
         property === 'carbohydrates' || property === 'protein' ||
         property === 'fat') {
         propValue = fruit.nutritions?.[property]?.toString().toLowerCase() || '';
      } else if (property === 'name') {
         propValue = fruit.name?.toLowerCase() || '';
      } else if (property === 'family') {
         propValue = fruit.family?.toLowerCase() || '';
      } else if (property === 'order') {
         propValue = fruit.order?.toLowerCase() || '';
      } else if (property === 'genus') {
         propValue = fruit.genus?.toLowerCase() || '';
      }


      const startsWithMatch = value.match(/^starts\s+with\s+(.+)$/i);
      if (startsWithMatch) {
         const searchValue = startsWithMatch[1].trim().toLowerCase();
         return propValue.startsWith(searchValue);
      }

      return propValue.includes(value.toLowerCase());
   }

   const startsWithMatch = trimmedTerm.match(/^starts\s+with\s+(.+)$/i);
   if (startsWithMatch) {
      const searchValue = startsWithMatch[1].trim().toLowerCase();
      return (
         fruit.name?.toLowerCase().startsWith(searchValue) ||
         fruit.family?.toLowerCase().startsWith(searchValue) ||
         fruit.order?.toLowerCase().startsWith(searchValue) ||
         fruit.genus?.toLowerCase().startsWith(searchValue)
      );
   }

   const search = trimmedTerm.toLowerCase();
   return (
      fruit.name?.toLowerCase().includes(search) ||
      fruit.family?.toLowerCase().includes(search) ||
      fruit.order?.toLowerCase().includes(search) ||
      fruit.genus?.toLowerCase().includes(search)
   );
}

function filterFruits(fruits, searchConfig) {
   const {
      mode,
      terms
   } = searchConfig;

   if (terms.length === 0) return [];

   if (mode === 'AND') {
      return fruits.filter(fruit => {
         return terms.every(term => fruitMatchesTerm(fruit, term));
      });
   } else {
      return fruits.filter(fruit => {
         return terms.some(term => fruitMatchesTerm(fruit, term));
      });
   }
}

async function searchFruit(text) {
   clearResult();

   if (!text) return;

   try {
      const fruits = await getAllFruits();

      if (text !== lastQuery) return;

      const searchConfig = parseSearchTerms(text);
      const matches = filterFruits(fruits, searchConfig);

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