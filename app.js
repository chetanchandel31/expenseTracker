// getting references
const headingEl = document.querySelector("#headingTotal");
const inputDescEl = document.querySelector("#inputDesc");
const inputElement = document.querySelector("#inputAmount");
const expenseTableEl = document.querySelector("#expenseTable");
const element = document.querySelector("#btnAddExpense");
const signInBtn = document.querySelector("#signInBtn");
const signOutBtn = document.querySelector("#signOutBtn");
const guestSignInBtn = document.querySelector("#guestSignInBtn");
const whenLoggedIn = document.querySelector("#whenLoggedIn");
const whenLoggedOut = document.querySelector("#whenLoggedOut");

// event listeners
element.addEventListener("click", addExpenseItem, false);
signInBtn.addEventListener("click", () =>
  firebase.auth().signInWithPopup(provider)
);
signOutBtn.addEventListener("click", () => firebase.auth().signOut());
guestSignInBtn.addEventListener("click", () =>
  firebase.auth().signInWithEmailAndPassword("test@test.com", "testtest")
);

// firebase stuff
// console.log(firebase);
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
const { serverTimestamp } = firebase.firestore.FieldValue;
let expenseCollectionRef;
let userUid;
let userDisplayName;
let unsubscribeExpenseCollectionRef;
let isFirstFirestoreFetch = true;

let currentTotalExpense = 0;

// firebase auth (1. switch between home and signin div 2. subscribe & unsubscibe from firestore)
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    userUid = user.uid;
    userDisplayName = user.displayName;
    expenseCollectionRef = db.collection(`users/${userUid}/expenses`);

    // listening to changes in firestore
    unsubscribeExpenseCollectionRef = expenseCollectionRef
      .orderBy("moment", "asc")
      .onSnapshot((snap) => {
        let documents = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        if (isFirstFirestoreFetch) findAndRenderTotalExpense(documents);
        renderList(documents);
      });

    whenLoggedIn.style.display = "block";
    whenLoggedOut.style.display = "none";
    signOutBtn.style.display = "inline";
  } else {
    whenLoggedIn.style.display = "none";
    whenLoggedOut.style.display = "flex";
    signOutBtn.style.display = "none";

    isFirstFirestoreFetch = true;

    clearPrevUserData();

    unsubscribeExpenseCollectionRef && unsubscribeExpenseCollectionRef();
  }
});

//custom functions
function addExpenseItem() {
  //read values from input fields
  const textAmount = inputElement.value;
  const textDesc = inputDescEl.value;

  //convert amount to number
  const expense = parseInt(textAmount, 10);

  if (textDesc && expense >= 0 && !isNaN(expense)) {
    expenseCollectionRef.add({
      desc: textDesc,
      amount: expense,
      moment: serverTimestamp(),
    });
    currentTotalExpense += expense;
    displayUpdatedTotal();

    inputDescEl.value = "";
    inputElement.value = "";
  } else if (expense <= 0) {
    alert('Would you really call that amount an "expense"? 😅');
  } else {
    alert("Invalid input. Have you filled all columns?");
  }
}

function displayUpdatedTotal() {
  headingEl.textContent = `${userDisplayName}'s total expense: ${currentTotalExpense}`;
}

function getDateString(moment) {
  return moment
    ?.toDate()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
}

function deleteItem(id, amount) {
  expenseCollectionRef.doc(id).delete();
  currentTotalExpense -= amount;
  displayUpdatedTotal();
}

function findAndRenderTotalExpense(array) {
  array.forEach((item) => {
    currentTotalExpense += item.amount;
  });
  headingEl.textContent = `${userDisplayName}'s total expense: ${currentTotalExpense}`;
  isFirstFirestoreFetch = false; // makes sure it runs only once
}

function clearPrevUserData() {
  headingEl.textContent = "";
  expenseTableEl.innerHTML = '<div class="loader"></div>';
  currentTotalExpense = 0;
}

function renderList(arrayName) {
  const expenseHTML = arrayName.map((expenseItems) =>
    createListItem(expenseItems)
  ); //converting array of objects to array of templated strings
  const joinedAllExpenseHTML = expenseHTML.join(" "); //converting an array of strings to a single string
  expenseTableEl.innerHTML = joinedAllExpenseHTML;
}

function createListItem({ desc, amount, moment, id }) {
  return `
            <li class="list-group-item d-flex justify-content-between">
				<div class="d-flex flex-column">
					${desc}
					<small class="text-muted">${getDateString(moment)}</small>
				</div>
                <div>
                    <span class="px-5">
                        ${amount}
                    </span>
                    <button type="button"
                        class="btn btn-outline-danger btn-sm"
                        onclick="deleteItem('${id}', ${amount})"
                        style = "float: right">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
			</li>
    `;
}
