const Modal = {
    isEditing: false,
    open(isEditing, index = null){
        if(isEditing){                       
            const transaction = Transaction.all[index];
            Form.updateFields(transaction);
            
        }else{              
            Form.clearFields();
        }
        document
            .querySelector('.modal-overlay').classList.add('active');
    },
   
    close(){
        document
            .querySelector('.modal-overlay').classList.remove('active');
    },
    
    setIsEditing(value){
        Modal.isEditing = value;
    }     
};

const Storage = {
    get(key, isObject){
        const StoredItem = localStorage.getItem(key);
        if(isObject) {
            return JSON.parse(StoredItem);
        }else{
            return StoredItem;
        }

    },
    set(key, value, isObject){
        if(isObject){
            localStorage.setItem(key, JSON.stringify(value))
        }else{
            localStorage.setItem(key, value)
        }

    },
};

const Transaction = {
    all: Storage.get('dev.finances:transactions', true) || [],
    underEditing: null,
    add(transaction){
        Transaction.all.push(transaction);        
        App.reload();
    },
    
    remove(index){
        Transaction.all.splice(index, 1);
        App.reload();
    },

    recover(index){ 
        Transaction.underEditing = index; 
        Modal.open(true);
    },

    update(index, updateTransaction){

        const { description, amount, date } = updateTransaction;

        Transaction.all[index] = {
            description,
            amount,
            date
        };
        App.reload();
        Modal.setIsEditing(false);
    },

    incomes(){
        let income = 0;
        Transaction.all.forEach((transaction) => {transaction.amount > 0 ? income += transaction.amount : ''})
        return income;
    },
    expenses(){
        let expense = 0;
        Transaction.all.forEach((transaction) => {transaction.amount < 0 ? expense += transaction.amount : ''})
        return expense;
    },
    total(){        
        return Transaction.incomes() + Transaction.expenses();
    }
}


const DOM = {

    transactionsContainer: document.querySelector("#data-table tbody"),

    addTransaction(transaction, index){
        let tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index        
        DOM.transactionsContainer.appendChild(tr)        
    },

    innerHTMLTransaction(transaction, index) {

        const CSSclass = transaction.amount > 0 ? "income" : "expense";
        const amount = Utils.formatCurrency(transaction.amount)

        const html = `        
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class="date">${transaction.date}</td>
            <td>
                <img style="cursor: pointer;" onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
            </td>     
            <td>
                <img class="edit" style="cursor: pointer;" onclick="Modal.open(true, ${index})" src="./assets/edit.svg" alt="Editar transação">
            </td>     

        `
        return html        
    },

    updateCard(){       
            const displayTotal = Transaction.total()        
            if( displayTotal < 0){
                document
                    .querySelector('.card.total')
                    .classList
                    .add('negative');
                }else{
                    document
                    .querySelector('.card.total')
                    .classList
                    .remove('negative');
                }       
    },

    updateBalance(){
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
    },
    

    clearTransactions(){
        DOM.transactionsContainer.innerHTML = '';
    }
    
}

const Utils = {
    formatAmount(value){
        value = Number(value)*100;
        return Math.round(value);
    },
    editAmount(amountValue){
        amountValue = Number(amountValue)/100;
        return Math.round(amountValue)
    },
    formatDate(date){
        const splittedDate = date.split('-');        
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },
    editDate(dateValue){
        const splittedDate = dateValue.split('/');
        return `${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}`
    },
    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : "";
        value = String(value).replace(/\D/g, "");
        value = Number(value)/100;
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
        return signal + value;
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues(){
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    setValues(description, amount, date){
        Form.description.value = description;
        Form.amount.value = amount;
        Form.date.value = date;        
    },

    validateFields(){
        const { description, amount, date } = Form.getValues()

        if(description.trim() === "" || amount.trim() === "" || date.trim() === ""){
            throw new Error("Oops!!! Você deve preencher todos os campos!");
        }
    },

    formatValues(){
        let { description, amount, date } = Form.getValues();
        amount = Utils.formatAmount(amount);
        date = Utils.formatDate(date);        
        return {
            description,
            amount,
            date
        }
    },
    
    saveTransaction(transaction){
        Transaction.add(transaction);
    },
    
    clearFields(){
        Form.description.value = '';
        Form.amount.value = '';
        Form.date.value = '';
    },
    
    submit(event) {
        event.preventDefault();
        
        try {            
            Form.validateFields();
            const index = Transaction.underEditing
            const transaction = Form.formatValues();
            if(Modal.isEditing){
                Transaction.update(index, transaction)
                App.reload();
            }else{                
                Form.saveTransaction(transaction);               
            }
            Form.clearFields();
            Modal.close();            
        } catch (error) {
            alert(error.message);           
        }
    },
    
    updateFields({ description, amount, date }){
        Form.description.value = description;
        Form.amount.value = Utils.editAmount(amount);
        Form.date.value = Utils.editDate(date);
    }
}

const changeTheme = document.getElementById('change-theme');

changeTheme.checked = false;

function handleClick(){
    if(this.checked){
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        localStorage.setItem("theme", "dark");
    }else{
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        localStorage.setItem("theme", "light");
    }
}


function chargerTheme(){
    const localStorageTheme = localStorage.getItem("theme");
    
    if(localStorageTheme != null && localStorageTheme === "dark"){
        document.body.className = localStorageTheme;
        
        const changedTheme = document.getElementById("change-theme");
        changedTheme.checked = true;
    }
}

changeTheme.addEventListener("click", handleClick)


const App = {
    init() {        
        Transaction.all.forEach(DOM.addTransaction);  
        DOM.updateCard();     
        DOM.updateBalance();        
        Storage.set('dev.finances:transactions', Transaction.all, true)         
    },
    reload() {
        DOM.clearTransactions();
        App.init();        
    }
}
App.init();

