const input = document.getElementById("fruitInput");
const result = document.getElementById("fruitResult");
const tagsContainer = document.getElementById("tagsContainer");
const autocompleteDropdown = document.getElementById("autocompleteDropdown");

const url = "https://fruityvice.com/api/fruit/all";
const proxy = "https://corsproxy.io/?" + encodeURIComponent(url);

let cachedFruits = null;
let lastQuery = "";
let tags = [];
let selectedAutocompleteIndex = -1;
let autocompleteItems = [];


const propertyNames = [
   { value: 'name', label: 'Name', icon: 'N' },
   { value: 'family', label: 'Family', icon: 'F' },
   { value: 'order', label: 'Order', icon: 'O' },
   { value: 'genus', label: 'Genus', icon: 'G' },
   { value: 'calories', label: 'Calories', icon: 'C' },
   { value: 'sugar', label: 'Sugar', icon: 'S' },
   { value: 'carbohydrates', label: 'Carbohydrates', icon: 'C' },
   { value: 'protein', label: 'Protein', icon: 'P' },
   { value: 'fat', label: 'Fat', icon: 'F' }
];

const numericProperties = ['calories', 'sugar', 'carbohydrates', 'protein', 'fat'];

const modifiers = [
   { value: 'starts with:', label: 'starts with:' },
   { value: 'ends with:', label: 'ends with:' }
];
const numericModifiers = [
   { value: '>=', label: '>=' },
   { value: '<=', label: '<=' }
];

window.addEventListener('DOMContentLoaded', () => {
   showAllFruits();
});


document.addEventListener('click', (e) => {
   if (!input.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
      hideAutocomplete();
   }
});

function hideAutocomplete() {
   autocompleteDropdown.classList.remove('show');
   autocompleteDropdown.innerHTML = '';
   autocompleteItems = [];
   selectedAutocompleteIndex = -1;
}

function showAutocomplete(items) {
   autocompleteDropdown.innerHTML = '';
   autocompleteItems = items;
   selectedAutocompleteIndex = -1;

   if (items.length === 0) {
      hideAutocomplete();
      return;
   }

   items.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.dataset.index = index;

      if (item.icon) {
         const icon = document.createElement('div');
         icon.className = 'autocomplete-item-icon';
         icon.textContent = item.icon;
         div.appendChild(icon);
      }

      const text = document.createElement('div');
      text.className = 'autocomplete-item-text';
      text.textContent = item.label;
      div.appendChild(text);

      div.addEventListener('click', () => selectAutocompleteItem(item));
      div.addEventListener('mouseenter', () => {
         selectedAutocompleteIndex = index;
         updateAutocompleteSelection();
      });

      autocompleteDropdown.appendChild(div);
   });

   autocompleteDropdown.classList.add('show');
}

function updateAutocompleteSelection() {
   const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
   items.forEach((item, index) => {
      if (index === selectedAutocompleteIndex) {
         item.classList.add('active');
      } else {
         item.classList.remove('active');
      }
   });
}

function selectAutocompleteItem(item) {
   const currentValue = input.value;

   if (item.isProperty) {
      input.value = item.value + ':';
   }
   else if (item.isModifier) {
      const colonIndex = currentValue.lastIndexOf(':');
      if (colonIndex !== -1) {
         const beforeColon = currentValue.substring(0, colonIndex + 1);
         input.value = beforeColon + ' ' + item.value + ' ';
      } else {
         input.value = item.value + ' ';
      }
   }
   else if (item.isNumericModifier) {
      const colonIndex = currentValue.lastIndexOf(':');
      if (colonIndex !== -1) {
         const beforeColon = currentValue.substring(0, colonIndex + 1);
         input.value = beforeColon + ' ' + item.value + ' ';
      } else {
         input.value = item.value + ' ';
      }
   }

   hideAutocomplete();
   input.focus();
}

function getAutocompleteSuggestions(value) {
   const trimmed = value.trim();

   if (!trimmed) {
      return propertyNames.map(p => ({ ...p, isProperty: true }));
   }

   const colonIndex = trimmed.indexOf(':');

   if (colonIndex === -1) {
      const filtered = propertyNames.filter(p =>
         p.value.toLowerCase().startsWith(trimmed.toLowerCase()) ||
         p.label.toLowerCase().startsWith(trimmed.toLowerCase())
      );
      return filtered.map(p => ({ ...p, isProperty: true }));
   } else {
      const beforeColon = trimmed.substring(0, colonIndex).trim();
      const afterColon = trimmed.substring(colonIndex + 1).trim();

      const matchedProperty = propertyNames.find(p =>
         p.value.toLowerCase() === beforeColon.toLowerCase()
      );

      if (!matchedProperty) return [];

      const isNumeric = numericProperties.includes(matchedProperty.value.toLowerCase());

      const afterColonHasColon = afterColon.indexOf(':');
      if (afterColonHasColon !== -1) return [];

      if (!afterColon) {
         if (isNumeric) {
            return [
               ...numericModifiers.map(m => ({ ...m, isNumericModifier: true })),
               ...modifiers.map(m => ({ ...m, isModifier: true }))
            ];
         }
         return modifiers.map(m => ({ ...m, isModifier: true }));
      }
      if (isNumeric) {
         const allModifiers = [
            ...numericModifiers.map(m => ({ ...m, isNumericModifier: true })),
            ...modifiers.map(m => ({ ...m, isModifier: true }))
         ];
         const filtered = allModifiers.filter(m =>
            m.value.toLowerCase().startsWith(afterColon.toLowerCase())
         );
         if (filtered.length === 0 && afterColon.length > 0) return [];
         return filtered;
      }

      const filtered = modifiers.filter(m =>
         m.value.toLowerCase().startsWith(afterColon.toLowerCase())
      );
      if (filtered.length === 0 && afterColon.length > 0) return [];
      return filtered.map(m => ({ ...m, isModifier: true }));
   }
}

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

   if (autocompleteDropdown.classList.contains('show')) {
      if (e.key === 'ArrowDown') {
         e.preventDefault();
         selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, autocompleteItems.length - 1);
         updateAutocompleteSelection();
         return;
      } else if (e.key === 'ArrowUp') {
         e.preventDefault();
         selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, 0);
         updateAutocompleteSelection();
         return;
      } else if (e.key === 'Enter' && selectedAutocompleteIndex >= 0) {
         e.preventDefault();
         selectAutocompleteItem(autocompleteItems[selectedAutocompleteIndex]);
         return;
      } else if (e.key === 'Escape') {
         e.preventDefault();
         hideAutocomplete();
         return;
      }
   }

   if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value.trim();
      if (value) {
         addTag(value);
         input.value = '';
         hideAutocomplete();
      }
   } else if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
      e.preventDefault();
      const lastTag = tags[tags.length - 1];
      removeTag(tags.length - 1);
      input.value = lastTag;
   }
});

input.addEventListener("input", () => {
   const q = input.value;
   lastQuery = q;

   const suggestions = getAutocompleteSuggestions(q);
   showAutocomplete(suggestions);

   if (tags.length === 0) {
      debounceSearch(q.trim());
   }
});

input.addEventListener("focus", () => {
   const q = input.value;
   const suggestions = getAutocompleteSuggestions(q);
   if (suggestions.length > 0) {
      showAutocomplete(suggestions);
   }
});

let t = null;

function isSearchTermComplete(text) {
   const trimmed = text.trim();
   if (!trimmed) return false;

   if (/^(\w+)\s*:\s*$/.test(trimmed)) return false;

   if (/(?:starts\s+with|ends\s+with)\s*:\s*$/i.test(trimmed)) return false;

   if (/^(\w+)\s*:\s*(?:starts\s+with|ends\s+with)\s*:\s*$/i.test(trimmed)) return false;
   
   if (/^(\w+)\s*:\s*(>=|<=)\s*$/.test(trimmed)) return false;

   return true;
}

function debounceSearch(q) {
   clearTimeout(t);
   t = setTimeout(() => searchFruit(q), 300);
}

async function getAllFruits() {
   if (cachedFruits) return cachedFruits;

   const response = await fetch(proxy);
   if (!response.ok) throw new Error("Failed to fetch fruits");

   cachedFruits = await response.json();
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

   return { mode, terms };
}

function fruitMatchesTerm(fruit, term) {
   const trimmedTerm = term.trim();

   // "calories: >= 50" ose "sugar: <= 10"
   const numericCompareMatch = trimmedTerm.match(/^(\w+)\s*:\s*(>=|<=)\s*(\d+(\.\d+)?)$/i);
   if (numericCompareMatch) {
      const property = numericCompareMatch[1].toLowerCase();
      const operator = numericCompareMatch[2];
      const compareValue = parseFloat(numericCompareMatch[3]);

      // Kontrollo nëse është pronë numerike
      if (!numericProperties.includes(property)) return false;

      const fruitValue = fruit.nutritions?.[property];
      if (fruitValue === undefined || fruitValue === null) return false;

      const numericFruitValue = parseFloat(fruitValue);
      if (isNaN(numericFruitValue)) return false;

      if (operator === '>=') return numericFruitValue >= compareValue;
      if (operator === '<=') return numericFruitValue <= compareValue;
   }

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
      if (property === 'name') propValue = fruit.name?.toLowerCase() || '';
      else if (property === 'family') propValue = fruit.family?.toLowerCase() || '';
      else if (property === 'order') propValue = fruit.order?.toLowerCase() || '';
      else if (property === 'genus') propValue = fruit.genus?.toLowerCase() || '';

      return propValue.startsWith(searchValue);
   }

   const propEndsMatch = trimmedTerm.match(/^(\w+)\s*:\s*ends\s+with:\s*(.+)$/i);
   if (propEndsMatch) {
      const property = propEndsMatch[1].toLowerCase();
      const searchValue = propEndsMatch[2].trim().toLowerCase();

      let propValue = '';
      if (property === 'name') propValue = fruit.name?.toLowerCase() || '';
      else if (property === 'family') propValue = fruit.family?.toLowerCase() || '';
      else if (property === 'order') propValue = fruit.order?.toLowerCase() || '';
      else if (property === 'genus') propValue = fruit.genus?.toLowerCase() || '';

      return propValue.endsWith(searchValue);
   }

   const propertyMatch = trimmedTerm.match(/^(\w+)\s*:\s*(.+)$/);
   if (propertyMatch) {
      const property = propertyMatch[1].toLowerCase();
      const value = propertyMatch[2].trim();

      let propValue = '';
      if (numericProperties.includes(property)) {
         propValue = fruit.nutritions?.[property]?.toString().toLowerCase() || '';
      } else if (property === 'name') propValue = fruit.name?.toLowerCase() || '';
      else if (property === 'family') propValue = fruit.family?.toLowerCase() || '';
      else if (property === 'order') propValue = fruit.order?.toLowerCase() || '';
      else if (property === 'genus') propValue = fruit.genus?.toLowerCase() || '';

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
   const { mode, terms } = searchConfig;

   if (terms.length === 0) return [];

   if (mode === 'AND') {
      return fruits.filter(fruit => terms.every(term => fruitMatchesTerm(fruit, term)));
   } else {
      return fruits.filter(fruit => terms.some(term => fruitMatchesTerm(fruit, term)));
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

   const searchConfig = { mode: effectiveMode, terms: searchTerms };
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
   if (!text || !isSearchTermComplete(text)) {
      showAllFruits();
      return;
   }

   clearResult();

   try {
      const fruits = await getAllFruits();

      if (tags.length > 0) return;
      else if (text !== lastQuery) return;

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