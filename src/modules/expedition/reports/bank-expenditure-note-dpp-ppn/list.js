import { inject } from 'aurelia-framework';
import moment from 'moment';
import numeral from 'numeral';
import XLSX from 'xlsx';
import { Service } from './service';
const SupplierLoader = require('../../../../loader/supplier-loader');
const DivisionLoader = require('../../../../loader/division-loader');
const PurchasingDocumentExpeditionLoader = require('../../../../loader/bank-expenditure-note-dpp-ppn-loader');
const BankExpenditureNoteDPPAndPPNLoader = require('../../../../loader/bank-expenditure-note-loader');

@inject(Service)
export class List {
    paymentMethodList = ["", "KREDIT", "DP(DOWN PAYMENT) + BP(BALANCE PAYMENT)", "DP(DOWN PAYMENT) + PERMIN 1 + BP(BALANCE PAYMENT)", "RETENSI"];
    isPaidFilter = { IsPaid: true };

    columns = [
        { field: 'DocumentNo', title: 'No Bukti Pengeluaran Bank' },
        {
            field: 'Date', title: 'Tanggal Bayar DPP + PPN', formatter: function (value, data, index) {
                return value ? moment(value).format('DD MMM YYYY') : '';
            },
        },
        { field: 'CategoryName', title: 'Category' },
        { field: 'DivisionName', title: 'Divisi' },
        { field: 'PaymentMethod', title: 'Cara Pembayaran' },
        {
            field: 'DPP', title: 'DPP', formatter: function (value, data, index) {
                return value ? numeral(value).format('0,000.0000') : '';
            },
        },
        {
            field: 'VAT', title: 'PPN', formatter: function (value, data, index) {
                return value ? numeral(value).format('0,000.0000') : '';
            },
        },
        {
            field: 'TotalPaid', title: 'Total Bayar Ke Supplier', formatter: function (value, data, index) {
                return value ? numeral(value).format('0,000.0000') : '';
            },
        },
        { field: 'Currency', title: 'Mata Uang' },
        { field: 'BankName', title: 'Bank Bayar PPH' },
        { field: 'SupplierName', title: 'Supplier' },
        { field: 'UnitPaymentOrderNo', title: 'No SPB' },
        { field: 'InvoiceNumber', title: 'No Invoice' }
    ];

    controlOptions = {
        label: {
            length: 4,
        },
        control: {
            length: 4,
        },
    };

    tableOptions = {
        showColumns: false,
        search: false,
        showToggle: false,
        sortable: false
    };

    constructor(service) {
        this.service = service;
        this.info = {};
        this.error = {};
    }

    loader = (info) => {
        let order = {};
        if (info.sort)
            order[info.sort] = info.order;

        let arg = {
            page: parseInt(info.offset / info.limit, 10) + 1,
            size: info.limit,
            order: order,
            select: [],
        };

        if (this.info.bankExpenditureNote)
            arg.documentNo = this.info.bankExpenditureNote.DocumentNo;
        if (this.info.unitPaymentOrder)
            arg.unitPaymentOrderNo = this.info.unitPaymentOrder.UnitPaymentOrderNo;
        if (this.info.invoice)
            arg.invoiceNo = this.info.invoice.InvoiceNo;
        if (this.info.supplier)
            arg.supplierCode = this.info.supplier.code;
        if (this.info.division)
            arg.divisionCode = this.info.division.code;
        if (this.info.paymentMethod)
            arg.paymentMethod = this.info.paymentMethod;
        if ((this.info.dateFrom && this.info.dateFrom != 'Invalid Date') || (this.info.dateTo && this.info.dateTo != 'Invalid Date')) {
            arg.dateFrom = this.info.dateFrom && this.info.dateFrom != 'Invalid Date' ? this.info.dateFrom : '';
            arg.dateTo = this.info.dateTo && this.info.dateTo != 'Invalid Date' ? this.info.dateTo : '';

            if (!arg.dateFrom) {
                arg.dateFrom = new Date(arg.dateTo);
                arg.dateFrom.setMonth(arg.dateFrom.getMonth() - 1);
            }

            if (!arg.dateTo) {
                arg.dateTo = new Date(arg.dateFrom);
                arg.dateTo.setMonth(arg.dateTo.getMonth() + 1);
            }

            arg.dateFrom = moment(arg.dateFrom).format("MM/DD/YYYY");
            arg.dateTo = moment(arg.dateTo).format("MM/DD/YYYY");
        } else {
            arg.dateFrom = new Date();
            arg.dateFrom.setMonth(arg.dateFrom.getMonth() - 1);
            arg.dateTo = new Date();

            arg.dateFrom = moment(arg.dateFrom).format("MM/DD/YYYY");
            arg.dateTo = moment(arg.dateTo).format("MM/DD/YYYY");
        }

        return this.flag ? (
            this.service.search(arg)
                .then((result) => {

                    let before = {};

                    for (let i in result.data) {
                        if (result.data[i].DocumentNo != before.DocumentNo) {
                            before = result.data[i];
                            before._DocumentNo_rowspan = 1;
                            before._Date_rowspan = 1;
                            before._CategoryName_rowspan = 1;
                            before._DivisionName_rowspan = 1;
                            before._PaymentMethod_rowspan = 1;
                            before._DPP_rowspan = 1;
                            before._VAT_rowspan = 1;
                            before._TotalPaid_rowspan = 1;
                            before._BankName_rowspan = 1;
                            before._Currency_rowspan = 1;
                        } else {
                            before._DocumentNo_rowspan++;
                            before._Date_rowspan++;
                            before._CategoryName_rowspan++;
                            before._DivisionName_rowspan++;
                            before._PaymentMethod_rowspan++;
                            before._DPP_rowspan++;
                            before._VAT_rowspan++;
                            before._TotalPaid_rowspan++;
                            before._BankName_rowspan++;
                            before._Currency_rowspan++;

                            before.DPP += result.data[i].DPP;
                            before.VAT += result.data[i].VAT;
                            before.TotalPaid += result.data[i].TotalPaid;

                            result.data[i].DocumentNo = undefined;
                            result.data[i].Date = undefined;
                            result.data[i].CategoryName = undefined;
                            result.data[i].DivisionName = undefined;
                            result.data[i].PaymentMethod = undefined;
                            result.data[i].DPP = undefined;
                            result.data[i].VAT = undefined;
                            result.data[i].TotalPaid = undefined;
                            result.data[i].Currency = undefined;
                            result.data[i].BankName = undefined;
                        }
                    }

                    setTimeout(() => {
                        $('#dpp-ppn-bank-table td').each(function () {
                            if ($(this).html() === '-')
                                $(this).hide();
                        })
                    }, 10);

                    return {
                        total: result.info.total,
                        data: result.data
                    };
                })
        ) : { total: 0, data: [] };
    }

    search() {
        if (this.info.dateFrom == 'Invalid Date')
            this.info.dateFrom = undefined;
        if (this.info.dateTo == 'Invalid Date')
            this.info.dateTo = undefined;

        if ((this.info.dateFrom && this.info.dateTo) || (!this.info.dateFrom && !this.info.dateTo)) {
            this.error = {};
            this.flag = true;
            this.tableList.refresh();
        } else {
            // console.log(this.info.dateFrom);
            // console.log(this.info.dateTo);
            if (!this.info.dateFrom)
                this.error.dateFrom = "Tanggal Awal harus diisi";
            if (!this.info.dateTo)
                this.error.dateTo = "Tanggal Akhir harus diisi";
        }
    }

    getExcelData() {
        let info = {
            offset: this.page * 50,
            limit: 50,
        };

        this.loader(info)
            .then(response => {
                this.excelData.push(...response.data);

                if (this.excelData.length !== response.total) {
                    this.page++;
                    this.getExcelData();
                }
                else {
                    let wsData = [];

                    for (let data of this.excelData) {
                        wsData.push({
                            'No Bukti Pengeluaran Bank': data.DocumentNo,
                            'Tanggal Bayar DPP + PPN': data.Date ? moment(data.Date).format('DD MMM YYYY') : '-',
                            'Category': data.CategoryName,
                            'Divisi': data.DivisionName,
                            'Cara Pembayaran': data.PaymentMethod,
                            'DPP': data.DPP ? numeral(data.DPP).format('0,000.0000') : '-',
                            'PPN': data.VAT ? numeral(data.VAT).format('0,000.0000') : '-',
                            'TotalPaid': data.TotalPaid ? numeral(data.TotalPaid).format('0,000.0000') : '-',
                            'Mata Uang': data.Currency,
                            'Bank Bayar PPH': data.BankName,
                            'Supplier': data.SupplierName,
                            'No SPB': data.UnitPaymentOrderNo,
                            'No Invoice': data.InvoiceNumber,
                        });
                    }

                    let wb = XLSX.utils.book_new();
                    wb.Props = {
                        Title: 'Report',
                        Subject: 'Dan Liris',
                        Author: 'Dan Liris',
                        CreatedDate: new Date()
                    };
                    wb.SheetNames.push('Laporan DPP PPN');

                    let ws = XLSX.utils.json_to_sheet(wsData);
                    wb.Sheets['Laporan DPP PPN'] = ws;

                    let wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
                    let buf = new ArrayBuffer(wbout.length);
                    let view = new Uint8Array(buf);
                    for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;

                    let fileSaver = require('file-saver');
                    fileSaver.saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Laporan DPP PPN.xlsx');
                }
            });
    }

    excel() {
        this.flag = true;

        this.page = 0;
        this.excelData = [];
        this.getExcelData();
    }

    reset() {
        this.flag = false;
        this.info.bankExpenditureNote = undefined;
        this.info.unitPaymentOrder = undefined;
        this.info.invoice = undefined;
        this.info.supplier = undefined;
        this.info.division = undefined;
        this.info.dateFrom = undefined;
        this.info.dateTo = undefined;
        this.info.paymentMethod = "";
        this.error.dateFrom = undefined;
        this.error.dateTo = undefined;
        this.tableList.refresh();
    }

    get supplierLoader() {
        return SupplierLoader;
    }

    get divisionLoader() {
        return DivisionLoader;
    }

    get purchasingDocumentExpeditionUPONoLoader() {
        return PurchasingDocumentExpeditionLoader;
    }

    get purchasingDocumentExpeditionInvoiceNoLoader() {
        return PurchasingDocumentExpeditionLoader;
    }

    get bankExpenditureNoteLoader() {
        return BankExpenditureNoteDPPAndPPNLoader;
    }
}
