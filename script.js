const input = document.getElementById("fruitInput");
const result = document.getElementById("fruitResult");
const tagsContainer = document.getElementById("tagsContainer");

const url = "https://fruityvice.com/api/fruit/all";
const proxy = "https://api.allorigins.win/get?url=" + encodeURIComponent(url);

let cachedFruits = null;
let lastQuery = "";
let tags = [];


window.addEventListener('DOMContentLoaded', () => {
   showAllFruits();
});

async function showAllFruits() {
   clearResult();

   try {
      const fruits = await getAllFruits();

      result.classList.add('grid-view');

      const fragment = document.createDocumentFragment();
      fruits.forEach((fruit) => fragment.appendChild(renderFruitCard(fruit)));
      result.appendChild(fragment);
   } catch (err) {
      clearResult();
      const p = document.createElement("p");
      p.textContent = "Error";
      result.appendChild(p);
      console.error(err);
   }
}

function addTag(text) {
   const trimmed = text.trim();
   if (!trimmed) return;

   if (tags.includes(trimmed)) return;

   tags.push(trimmed);
   renderTags();
   performSearch();
}

function removeTag(index) {
   tags.splice(index, 1);
   renderTags();

   if (tags.length === 0) {
      showAllFruits();
   } else {
      performSearch();
   }
}

function editTag(index) {
   const tagText = tags[index];
   tags.splice(index, 1);
   input.value = tagText;
   input.focus();
   renderTags();

   if (tags.length === 0) {
      showAllFruits();
   }
}

function renderTags() {
   tagsContainer.innerHTML = '';

   tags.forEach((tagText, index) => {
      const tag = document.createElement('div');
      tag.className = 'tag';

      const span = document.createElement('span');
      span.textContent = tagText;
      span.ondblclick = () => editTag(index);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = () => removeTag(index);

      tag.appendChild(span);
      tag.appendChild(removeBtn);
      tagsContainer.appendChild(tag);
   });
}

input.addEventListener("keydown", (e) => {
   if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      if (value) {
         addTag(value);
         input.value = '';
      }
   } else if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
      e.preventDefault();
      const lastTag = tags[tags.length - 1];
      removeTag(tags.length - 1);
      input.value = lastTag;
   }
});

input.addEventListener("input", () => {
   const q = input.value.trim();
   lastQuery = q;

   if (tags.length === 0) {
      debounceSearch(q);
   }
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
   } else if (text.includes('||')) {
      mode = 'OR';
      terms = text.split('||').map(t => t.trim()).filter(t => t);
   } else {
      mode = 'OR';

      if (text.includes(':')) {
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


   const startsWithMatch = trimmedTerm.match(/^starts\s+with:\s*(.+)$/i);
   if (startsWithMatch) {
      const searchValue = startsWithMatch[1].trim().toLowerCase();
      return (
         fruit.name?.toLowerCase().startsWith(searchValue) ||
         fruit.family?.toLowerCase().startsWith(searchValue) ||
         fruit.order?.toLowerCase().startsWith(searchValue) ||
         fruit.genus?.toLowerCase().startsWith(searchValue)
      );
   }

   const endsWithMatch = trimmedTerm.match(/^ends\s+with:\s*(.+)$/i);
   if (endsWithMatch) {
      const searchValue = endsWithMatch[1].trim().toLowerCase();
      return (
         fruit.name?.toLowerCase().endsWith(searchValue) ||
         fruit.family?.toLowerCase().endsWith(searchValue) ||
         fruit.order?.toLowerCase().endsWith(searchValue) ||
         fruit.genus?.toLowerCase().endsWith(searchValue)
      );
   }


   const propStartsMatch = trimmedTerm.match(/^(\w+)\s*:\s*starts\s+with:\s*(.+)$/i);
   if (propStartsMatch) {
      const property = propStartsMatch[1].toLowerCase();
      const searchValue = propStartsMatch[2].trim().toLowerCase();

      let propValue = '';
      if (property === 'name') {
         propValue = fruit.name?.toLowerCase() || '';
      } else if (property === 'family') {
         propValue = fruit.family?.toLowerCase() || '';
      } else if (property === 'order') {
         propValue = fruit.order?.toLowerCase() || '';
      } else if (property === 'genus') {
         propValue = fruit.genus?.toLowerCase() || '';
      }

      return propValue.startsWith(searchValue);
   }


   const propEndsMatch = trimmedTerm.match(/^(\w+)\s*:\s*ends\s+with:\s*(.+)$/i);
   if (propEndsMatch) {
      const property = propEndsMatch[1].toLowerCase();
      const searchValue = propEndsMatch[2].trim().toLowerCase();

      let propValue = '';
      if (property === 'name') {
         propValue = fruit.name?.toLowerCase() || '';
      } else if (property === 'family') {
         propValue = fruit.family?.toLowerCase() || '';
      } else if (property === 'order') {
         propValue = fruit.order?.toLowerCase() || '';
      } else if (property === 'genus') {
         propValue = fruit.genus?.toLowerCase() || '';
      }

      return propValue.endsWith(searchValue);
   }


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

      return propValue.includes(value.toLowerCase());
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

function performSearch() {
   if (tags.length === 0) {
      showAllFruits();
      return;
   }

   if (tags.length === 1) {
      const singleTag = tags[0];
      if (singleTag.includes('&&') || singleTag.includes('||')) {
         const searchConfig = parseSearchTerms(singleTag);
         searchFruitWithConfig(searchConfig);
         return;
      }
   }

   let effectiveMode = 'OR';
   let searchTerms = [];

   const hasAndOperator = tags.includes('&&');
   const hasOrOperator = tags.includes('||');

   if (hasAndOperator) {
      effectiveMode = 'AND';
      searchTerms = tags.filter(tag => tag !== '&&');
   } else if (hasOrOperator) {
      effectiveMode = 'OR';
      searchTerms = tags.filter(tag => tag !== '||');
   } else {
      effectiveMode = 'OR';
      searchTerms = tags;
   }

   if (searchTerms.length === 0) {
      showAllFruits();
      return;
   }

   const searchConfig = {
      mode: effectiveMode,
      terms: searchTerms
   };

   searchFruitWithConfig(searchConfig);
}

async function searchFruitWithConfig(searchConfig) {
   clearResult();

   try {
      const fruits = await getAllFruits();
      const matches = filterFruits(fruits, searchConfig);

      clearResult();

      if (matches.length === 0) {
         const p = document.createElement("p");
         p.textContent = "Nuk u gjet fruti";
         result.appendChild(p);
         return;
      }

      result.classList.add('grid-view');

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

async function searchFruit(text) {
   if (!text) {
      showAllFruits();
      return;
   }

   clearResult();

   try {
      const fruits = await getAllFruits();

      if (tags.length > 0) {
         return;
      } else if (text !== lastQuery) {
         return;
      }

      const searchConfig = parseSearchTerms(text);
      const matches = filterFruits(fruits, searchConfig);

      clearResult();

      if (matches.length === 0) {
         const p = document.createElement("p");
         p.textContent = "Nuk u gjet fruti";
         result.appendChild(p);
         return;
      }


      result.classList.add('grid-view');

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