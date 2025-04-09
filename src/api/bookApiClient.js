// src/api/bookApiClient.js
/**
 * 複数の本のAPIを統合して検索するクライアント
 */

import { 
  searchBooksByTitle as googleSearchByTitle,
  searchBooksByAuthor as googleSearchByAuthor,
  fetchBookByISBN as googleFetchByISBN
} from './googleBooksApi';

import {
  searchBooksByTitle as ndlSearchByTitle,
  searchBooksByAuthor as ndlSearchByAuthor,
  fetchBookByISBN as ndlFetchByISBN
} from './ndlApi';

// APIソースの定義
export const API_SOURCES = {
  GOOGLE_BOOKS: 'googleBooks',
  NDL: 'ndl',
  ALL: 'all'
};

// デフォルトのAPIソース
const DEFAULT_API_SOURCE = API_SOURCES.GOOGLE_BOOKS;

/**
 * タイトルで本を検索する - 複数のAPIから取得
 * @param {string} title - 検索するタイトル
 * @param {number} maxResults - 結果の最大数
 * @param {string} orderBy - 結果の並び順
 * @param {string} apiSource - 使用するAPIソース
 * @returns {Promise<Array>} - 検索結果
 */
export const searchBooksByTitle = async (
  title, 
  maxResults = 20, 
  orderBy = 'newest',
  apiSource = DEFAULT_API_SOURCE
) => {
  try {
    let results = [];

    if (apiSource === API_SOURCES.GOOGLE_BOOKS || apiSource === API_SOURCES.ALL) {
      const googleResults = await googleSearchByTitle(title, maxResults, orderBy);
      googleResults.forEach(book => {
        book.apiSource = API_SOURCES.GOOGLE_BOOKS;
      });
      results = [...results, ...googleResults];
    }

    if (apiSource === API_SOURCES.NDL || apiSource === API_SOURCES.ALL) {
      const ndlResults = await ndlSearchByTitle(title, maxResults);
      ndlResults.forEach(book => {
        book.apiSource = API_SOURCES.NDL;
      });
      results = [...results, ...ndlResults];
    }

    // 結果が多すぎる場合は制限
    if (results.length > maxResults) {
      results = results.slice(0, maxResults);
    }

    // リリース日でソート（指定された場合）
    if (orderBy === 'newest' && results.length > 0) {
      results.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB - dateA; // 降順（新しい順）
      });
    }

    return results;
  } catch (error) {
    console.error('書籍検索エラー:', error);
    throw error;
  }
};

/**
 * 著者名で本を検索する - 複数のAPIから取得
 * @param {string} author - 検索する著者名
 * @param {number} maxResults - 結果の最大数
 * @param {string} orderBy - 結果の並び順
 * @param {string} apiSource - 使用するAPIソース
 * @returns {Promise<Array>} - 検索結果
 */
export const searchBooksByAuthor = async (
  author, 
  maxResults = 20, 
  orderBy = 'newest',
  apiSource = DEFAULT_API_SOURCE
) => {
  try {
    let results = [];

    if (apiSource === API_SOURCES.GOOGLE_BOOKS || apiSource === API_SOURCES.ALL) {
      const googleResults = await googleSearchByAuthor(author, maxResults, orderBy);
      googleResults.forEach(book => {
        book.apiSource = API_SOURCES.GOOGLE_BOOKS;
      });
      results = [...results, ...googleResults];
    }

    if (apiSource === API_SOURCES.NDL || apiSource === API_SOURCES.ALL) {
      const ndlResults = await ndlSearchByAuthor(author, maxResults);
      ndlResults.forEach(book => {
        book.apiSource = API_SOURCES.NDL;
      });
      results = [...results, ...ndlResults];
    }

    // 結果が多すぎる場合は制限
    if (results.length > maxResults) {
      results = results.slice(0, maxResults);
    }

    // リリース日でソート（指定された場合）
    if (orderBy === 'newest' && results.length > 0) {
      results.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB - dateA; // 降順（新しい順）
      });
    }

    return results;
  } catch (error) {
    console.error('書籍検索エラー:', error);
    throw error;
  }
};

/**
 * ISBNで本を検索する - 複数のAPIから取得
 * @param {string} isbn - 検索するISBN
 * @param {string} apiSource - 使用するAPIソース
 * @returns {Promise<Object|null>} - 本の情報
 */
export const fetchBookByISBN = async (isbn, apiSource = DEFAULT_API_SOURCE) => {
  try {
    // 優先順位: NDL -> Google Books
    // 日本の本の場合、NDLの方が情報が充実している場合が多い
    if (apiSource === API_SOURCES.NDL || apiSource === API_SOURCES.ALL) {
      const ndlResult = await ndlFetchByISBN(isbn);
      if (ndlResult) {
        ndlResult.apiSource = API_SOURCES.NDL;
        return ndlResult;
      }
    }

    // NDLで見つからない場合、Google Booksを試す
    if (apiSource === API_SOURCES.GOOGLE_BOOKS || apiSource === API_SOURCES.ALL) {
      const googleResult = await googleFetchByISBN(isbn);
      if (googleResult) {
        googleResult.apiSource = API_SOURCES.GOOGLE_BOOKS;
        return googleResult;
      }
    }

    return null;
  } catch (error) {
    console.error('ISBN検索エラー:', error);
    throw error;
  }
};