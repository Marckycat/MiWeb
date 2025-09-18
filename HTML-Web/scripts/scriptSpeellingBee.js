const hive = document.getElementById("hive");
const letters = ["A", "R", "T", "E", "S", "O", "N"]; // ejemplo
const centerIndex = 3; // la letra central obligatoria (E)

let score = 0;
let found = [];

function buildHive() {
  hive.innerHTML = "";

  const layout = [
    "", 0, "",
    1, 2, 3,
    "", 4, "",
    "", 5, 6, ""
  ];

  layout.forEach(i => {
    if (i === "") {
      hive.appendChild(document.createElement("div"));
      return;
    }

    const cell = document.createElement("div");
    cell.className = "cell" + (i === centerIndex ? " center" : "");
    cell.textContent = letters[i];
    cell.onclick = () => {
      document.getElementById("wordInput").value += letters[i];
    };
    hive.appendChild(cell);
  });
}

function checkWord() {
  const input = document.getElementById("wordInput");
  let word = input.value.toUpperCase();
  input.value = "";

  if (word.length < 4) {
    alert("Mínimo 4 letras");
    return;
  }
  if (!word.includes(letters[centerIndex])) {
    alert("Debe incluir la letra central");
    return;
  }
  if (found.includes(word)) {
    alert("Ya encontraste esa palabra");
    return;
  }

  for (const ch of word) {
    if (!letters.includes(ch)) {
      alert("Letra inválida: " + ch);
      return;
    }
  }

  found.push(word);
  score += word.length;
  document.getElementById("score").textContent = score;

  const fw = document.getElementById("foundWords");
  fw.innerHTML += `<div>${word}</div>`;
}

document.getElementById("submit").onclick = checkWord;

buildHive();
