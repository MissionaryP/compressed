#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import { promisify } from 'util';

const program = new Command();
const writeFileAsync = promisify(fs.writeFile);

const makeRequest = async (url) => {
  try {
    const response = await axios.get(url);
    const html = response.data;

    console.log('Response received. Parsing HTML...');

    const $ = cheerio.load(html);
    const jsonResult = {
      title: $('title').text(),
      headings: [],
      buttons: [],
      inputs: [],
      carousels: [],
      selects: []
    };

    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((index, element) => {
      jsonResult.headings.push({
        tag: element.tagName,
        text: $(element).text()
      });
    });

    // Extract buttons
    $('button').each((index, element) => {
      jsonResult.buttons.push({
        text: $(element).text(),
        html: $(element).html()
      });
    });

    // Extract input fields, excluding hidden ones
    $('input').each((index, element) => {
      if ($(element).attr('type') !== 'hidden') {
        jsonResult.inputs.push({
          type: $(element).attr('type'),
          name: $(element).attr('name'),
          value: $(element).attr('value'),
          placeholder: $(element).attr('placeholder')
        });
      }
    });

    // Extract carousels (assuming a common class name 'carousel')
    $('.carousel').each((index, element) => {
      jsonResult.carousels.push({
        html: $(element).html()
      });
    });

    // Extract select elements
    $('select').each((index, element) => {
      const options = [];
      $(element).find('option').each((i, option) => {
        options.push({
          value: $(option).attr('value'),
          text: $(option).text()
        });
      });
      jsonResult.selects.push({
        name: $(element).attr('name'),
        options: options
      });
    });

    const jsonString = JSON.stringify(jsonResult, null, 2);

    try {
      await writeFileAsync('doc/json-body/response.json', jsonString);
      console.log('JSON file has been saved as response.json');
    } catch (writeError) {
      console.error('Failed to write JSON file:', writeError);
    }
  } catch (error) {
    console.error('Error fetching the URL:', error);
  }
};

// Define the command and its action
program
  .version('1.0.0')
  .description('A simple Commander.js app to make HTTP requests and convert HTML response to JSON')
  .argument('<url>', 'URL to make the HTTP request to')
  .action((url) => {
    makeRequest(url);
  });

program.parse(process.argv);