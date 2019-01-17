import { inject, bindable, containerless, computedFrom, BindingEngine } from 'aurelia-framework'
import { Service } from "./service";
var SupplierLoader = require('../../../loader/supplier-azure-loader');
var CurrencyLoader = require('../../../loader/currency-azure-loader');
var UnitLoader = require('../../../loader/unit-azure-loader');
var DivisionLoader = require('../../../loader/division-azure-loader');
var CategoryLoader = require('../../../loader/category-azure-loader');
//var IncomeTaxLoader = require('../../../loader/income-tax-loader');

@containerless()
@inject(Service, BindingEngine)
export class DataForm {
    @bindable readOnly = false;
    @bindable data = {};
    @bindable error = {};
    @bindable title;
    @bindable selectedSupplier;
    @bindable selectedCurrency;
    @bindable selectedCategory;
    @bindable selectedDivision;
    
    controlOptions = {
        label: {
            length: 4
        },
        control: {
            length: 5
        }
    }

    IncomeTaxByOptions=["Supplier","Dan Liris"];

    itemsColumns = [{ header: "Nomor External PO"},
                    { header: "Kena PPN"},
                    { header: "Nominal PPN"},
                    { header: "Kena PPH"},
                    { header: "PPH"},
                    { header: "Nominal PPH"},
                    { header: ""}];

    constructor(service, bindingEngine) {
        this.service = service;
        this.bindingEngine = bindingEngine;
    }

    bind(context) {
        this.context = context;
        this.data = this.context.data;
        this.error = this.context.error;

        if (this.data.supplier) {
            this.selectedSupplier = this.data.supplier;
        }
        if(this.readOnly){
            this.data.Amount=this.data.Amount.toLocaleString('en-EN', { minimumFractionDigits: 4 });
        }
    }

    @computedFrom("data.Id")
    get isEdit() {
        return (this.data.Id || '').toString() != '';
    }

    @computedFrom("data.Supplier && data.Currency && data.Category && data.Division")
    get filter() {
        var filter={};
        if(this.data.Supplier && this.data.Currency && this.data.Category && this.data.Division){
            filter = {
                supplierId: this.data.Supplier.Id || this.data.Supplier._id,
                currencyId:this.data.Currency.Id||  this.data.Currency._id,
                categoryId:this.data.Category.Id || this.data.Category._id,
                divisionId:this.data.Division.Id || this.data.Division._id
            }
        }
        return filter;
    }

    selectedCategoryChanged(newValue) {
        var _selectedCategory = newValue;
        if (_selectedCategory.Id || _selectedCategory._id) {
            this.data.Category = _selectedCategory;
            this.data.categoryId = _selectedCategory.Id || _selectedCategory._id;
            this.data.Category.Name = _selectedCategory.name;
            this.data.Category.Id = _selectedCategory._id;
            this.data.Category.Code = _selectedCategory.code;
        }
        else{
            this.data.Category = {};
            this.data.Items.splice(0);
        }
    }

    selectedDivisionChanged(newValue) {
        var _selectedDivision = newValue;
        if (_selectedDivision.Id|| _selectedDivision._id) {
            this.data.Division = _selectedDivision;
            this.data.divisionId = _selectedDivision.Id || _selectedDivision._id;
            // this.data.Division.Name = _selectedDivision.name;
            // this.data.Division.Id = _selectedDivision.Id;
            // this.data.Division.Code = _selectedDivision.code;
        } 
        else{
            this.data.Division = {};
            this.data.Items.splice(0);
        }
    }

    selectedSupplierChanged(newValue) {
        var _selectedSupplier = newValue;
        if (_selectedSupplier.Id || _selectedSupplier._id) {
            this.data.Supplier = _selectedSupplier;
            this.data.supplierId = _selectedSupplier.Id || _selectedSupplier._id;
            // this.data.Supplier.Name = _selectedSupplier.name;
            // this.data.Supplier.Id = _selectedSupplier._id;
            // this.data.Supplier.Code = _selectedSupplier.code;
        } 
        else{
            this.data.Supplier = {};
            this.data.Items.splice(0);
        }
    }

    selectedCurrencyChanged(newValue){
        console.log(newValue)
        this.data.Currency = {};
        if(this.data.Items)
            this.data.Items.splice(0);
        if(newValue.Id){
            this.data.Currency=newValue;
            // this.data.Currency.Id=newValue.Id;
            // this.data.Currency.Code=newValue.code;
            // this.data.Currency.Name=newValue.name;
        } 
        else{
            this.data.Currency = {};
            this.data.Items.splice(0);
        }
    }

    get supplierLoader() {
        return SupplierLoader;
    }
    
    get currencyLoader() {
        return CurrencyLoader;
    }

    get addItems() {
        return (event) => {
            this.data.Items.push({ })
        };
    }

    currencyView = (currency) => {
        return currency.code || currency.Code;
    }

    supplierView = (supplier) => {
        var code= supplier.code || supplier.Code;
        var name= supplier.name || supplier.Name;
        return `${code} - ${name}`
    }

    itemsChanged(e){
        if(this.data.Items){
            this.data.Amount=0;
            for(var item of this.data.Items){
                if(item.Details){
                    for(var detail of item.Details){
                        var pph=0;
                        var ppn=0;
                        if(item.UseIncomeTax){
                            var rate= item.IncomeTax.Rate ? item.IncomeTax.Rate : item.IncomeTax.rate;
                            pph=detail.PaidPrice*(parseFloat(rate)/100);
                        }
                        if(item.UseVat){
                            ppn=detail.PaidPrice*0.1;
                        }

                        this.data.Amount+=detail.PaidPrice+ppn+pph;
                    }
                }
            }
        }
    }

    get removeItems() {
        return (event) => //console.log(event.detail);
        {
            if(this.data.Items){
                this.data.Amount=0;
                for(var item of this.data.Items){
                    if(item.Details){
                        for(var detail of item.Details){
                            var pph=0;
                            var ppn=0;
                            if(item.UseIncomeTax){
                                var rate= item.IncomeTax.Rate ? item.IncomeTax.Rate : item.IncomeTax.rate;
                                pph=detail.PaidPrice*(parseFloat(rate)/100);
                            }
                            if(item.UseVat){
                                ppn=detail.PaidPrice*0.1;
                            }
                            this.data.Amount+=detail.PaidPrice+ppn+pph;
                        }
                    }
                }
            }
        }
    }

    divisionView = (division) => {
        return division.name || division.Name;
    }

    categoryView = (category) => {
        var code= category.code || category.Code;
        var name= category.name || category.Name;
        return `${code} - ${name}`;
    }

     get divisionLoader() {
        return DivisionLoader;
    }

    get categoryLoader() {
        return CategoryLoader;
    }

} 