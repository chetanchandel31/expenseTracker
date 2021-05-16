//getting references
const headingEl = document.querySelector("#headingTotal");
const inputDescEl = document.querySelector("#inputDesc");
const inputElement = document.querySelector("#inputAmount");
const expenseTableEl = document.querySelector("#expenseTable");
const element = document.querySelector("#btnAddExpense");

//listen to click event
element.addEventListener("click", addExpenseItem, false);

//firebase stuff
console.log(firebase);
const db = firebase.firestore();
const { serverTimestamp } = firebase.firestore.FieldValue;
const expenseCollectionRef = db.collection("expenses");
const totalExpenseRef = db.collection("totalExpense").doc("6OOfox0sDzOjoeCiKZYj");

let currentTotalExpense = 0;

totalExpenseRef.onSnapshot(doc => {
	let { totalExpense } = doc.data();
	currentTotalExpense = totalExpense;
	headingEl.textContent = `Total Expense: ${currentTotalExpense}`;
});

expenseCollectionRef.orderBy("moment", "asc").onSnapshot(snap => {
	let documents = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
	renderList(documents);
});

//custom functions
function addExpenseItem() {
	//read values from input fields
	const textAmount = inputElement.value;
	const textDesc = inputDescEl.value;

	//convert amount to number
	const expense = parseInt(textAmount, 10);

	if (textDesc && expense >= 0 && !isNaN(expense)) {
		expenseCollectionRef.add({ desc: textDesc, amount: expense, moment: serverTimestamp() });
		currentTotalExpense += expense;
		totalExpenseRef.set({ totalExpense: currentTotalExpense });

		inputDescEl.value = "";
		inputElement.value = "";
	} else if (expense <= 0) {
		alert('Would you really call that amount an "expense"? 😅');
	} else {
		alert("Invalid input. Have you filled all columns?");
	}
}

//controller function
function getDateString(moment) {
	return moment?.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function deleteItem(id, amount) {
	expenseCollectionRef.doc(id).delete();
	currentTotalExpense -= amount;
	totalExpenseRef.set({ totalExpense: currentTotalExpense });
}

//view layer
function renderList(arrayName) {
	const expenseHTML = arrayName.map(expenseItems => createListItem(expenseItems)); //converting array of objects to array of templated strings
	const joinedAllExpenseHTML = expenseHTML.join(""); //converting an array of strings to a single string
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
