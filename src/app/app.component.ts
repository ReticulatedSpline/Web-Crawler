import {
  Component,
  OnInit,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormArray,
  Validators
} from '@angular/forms';
import {
  MatButtonModule,
  MatSlideToggleModule,
  MatInputModule,
  MatSnackBar,
  MatCardModule,
  MatSelectModule,
  MatSliderModule,
  MatProgressBarModule
} from '@angular/material';
import 'hammerjs';
import { NetworkService } from './network.service';
import { Regex } from './regex';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public regexes: Regex[];
  public formArray: FormArray;
  public clipboard: string[];
  public csvString: string;
  public mailLink: string;
  public clipboardText: string;
  public root: string;
  public submitted: boolean;
  public email: boolean;
  public phone: boolean;
  public external: boolean;
  public loaded: boolean;
  public depth: number;

  constructor(public snackBar: MatSnackBar,
    private networkService: NetworkService) {
    this.regexes = [];
    this.clipboard = [];
    this.submitted = false;
    this.email = true;
    this.phone = true;
    this.external = true;
    this.depth = 10;
    this.root = defaultRoot;
    this.loaded = false;
    this.clipboardText = "Results copied to clipboard!";
    this.csvString = "";
  }

  addRegex(): void {
    this.regexes.push(new Regex("", ""));
  }

  removeRegex(): void {
    this.regexes.pop();
  }

  valid(): boolean {
    for (let regex of this.regexes) {
      if (regex.name === "" ||
        regex.expr === "") {
        return false;
      }
    }
    if (this.root === "") {
      return false;
    } else {
      return true;
    }
  }

  onKey(event: "rootTrigger") {
    this.valid();
  }

  submit(): void {
    if (this.email) this.regexes.push(new Regex("Email", emailExpr));
    if (this.phone) this.regexes.push(new Regex("Phone", phoneExpr));
    this.submitted = true;
    console.log("Submitting request to server...");
    // this probably violates every convention of angular, javascript, and async programming. Also the 80 character limit. Who's going to stop me?
    let parent = this;
    this.networkService.start(this.root, this.depth, this.regexes, this.external, parent)
      .subscribe(res => {
        console.log("Response recieved!");
        let parsed = res.json();
        parsed.forEach(function(item, index) {
          parent.regexes[index] = item;
        });
        parent.setMailTo();
        parent.setCSVString();
        parent.setClipboard();
        parent.loaded = true;
      });
  }

  setMailTo(): void {
    this.mailLink = String("mailto:?subject=Scrape%20Results%20&body=");
    for (let regex of this.regexes) {
      // %0D%0A is an URI encoded newline and carriage return char
      this.mailLink += "%0D%0A----------";
      this.mailLink += regex.name.endsWith('s') ?
        regex.name + "es" : regex.name + "s";
      this.mailLink += "----------%0D%0A";
      this.mailLink += regex.found.join(', ') + "%0D%0A";
    }
  }

  setClipboard(): void {
    for (let regex of this.regexes) {
      this.clipboard.push("\n----------\n");
      this.clipboard.push(regex.name.endsWith('s') ? regex.name + "es" : regex.name + "s");
      this.clipboard.push("\n----------\n");
      this.clipboard.push(regex.found + "\n");
    }
  }

  setCSVString() {
    // Building the CSV from the Data two-dimensional array
    // Each column is separated by ";" and new line "\n" for next row
    for (let regex of this.regexes) {
      for (let result of regex.found) {
        this.csvString += result;
        this.csvString += "\n";
      }
      this.csvString += ";";
    }
  }

  // The download function takes a CSV string, the filename and mimeType as parameters
  download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) { // IE10
      navigator.msSaveBlob(new Blob([content], {
        type: mimeType
      }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
      a.href = URL.createObjectURL(new Blob([content], {
        type: mimeType
      }));
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
    }
  }

  openSnackbar(text: string) {
    //TODO: add copy functionality
    this.snackBar.open("Success!", "Close", {
      duration: 2000,
    });
  }

  reset() {
    this.regexes = [];
    this.submitted = false;
    this.loaded = false;
  }

  public githubLogoPath = "https://assets-cdn.github.com/favicon.ico";
  public questionMarkLogoPath = "http://www.act.org/content/dam/act/unsecured/Images/icons/icon-question.png";
  public githubLink = "https://github.com/ReticulatedSpline/Web-Crawler";
  public regexLink = "https://www.w3schools.com/jsref/jsref_obj_regexp.asp"
}

const defaultRoot = "http://www.mdbizcon.com";
const emailExpr = "([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)";
const phoneExpr = "(\(\d{3}\)|\d{3})-?\d{3}-?\d{4}";
const addressExpr = "\d{1,5}\s\w.\s(\b\w*\b\s){1,2}\w*\.";
