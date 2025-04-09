// src/api/bookApiClient.js
import * as googleBooksApi from './googleBooksApi';
import * as rakutenBooksApi from './rakutenBooksApi';

// APIソースの列挙型
export const ApiSource = {
  GOOGLE_BOOKS: 'google',
  RAKUTEN_BOOKS: 'rakuten',
  BOTH: 'both'  // 両方のAPIから検索する場合
};

/**
 * タイトルで本を検索する（複数のAPIソースから）
 * @param {string} title - 検索するタイトル
 * @param {number} maxResults - 結果の最大数
 * @param {string} sortOrder - 結果の並び順
 * @param {string} apiSource - 使用するAPIソース
 * @returns {Promise} - 検索結果を含むPromise
 */
export const searchBooksByTitle = async (title, maxResults = 20, sortOrder = 'newest', apiSource = ApiSource.BOTH) => {
  try {
    let results = [];

    if (apiSource === ApiSource.GOOGLE_BOOKS || apiSource === ApiSource.BOTH) {
      const googleResults = await googleBooksApi.searchBooksByTitle(title, maxResults, sortOrder);
      results = [...results, ...googleResults.map(book => ({ ...book, apiSource: 'google' }))];
    }

    if (apiSource === ApiSource.RAKUTEN_BOOKS || apiSource === ApiSource.BOTH) {
      // 楽天APIの並び順パラメータは異なるため変換
      const rakutenSortOrder = sortOrder === 'newest' ? 'releaseDate' : 'standard';
      const rakutenResults = await rakutenBooksApi.searchBooksByTitle(title, maxResults, rakutenSortOrder);
      results = [...results, ...rakutenResults.map(book => ({ ...book, apiSource: 'rakuten' }))];
    }

    // 重複を除去（ISBN13が同じものは重複と見なす）
    const uniqueResults = removeDuplicates(results);
    
    // 件数制限
    return uniqueResults.slice(0, maxResults);
  } catch (error) {
    console.error('本の検索エラー:', error);
    throw error;
  }
};

/**
 * 著者名で本を検索する（複数のAPIソースから）
 * @param {string} author - 検索する著者名
 * @param {number} maxResults - 結果の最大数
 * @param {string} sortOrder - 結果の並び順
 * @param {string} apiSource - 使用するAPIソース
 * @returns {Promise} - 検索結果を含むPromise
 */
export const searchBooksByAuthor = async (author, maxResults = 20, sortOrder = 'newest', apiSource = ApiSource.BOTH) => {
  try {
    let results = [];

    if (apiSource === ApiSource.GOOGLE_BOOKS || apiSource === ApiSource.BOTH) {
      const googleResults = await googleBooksApi.searchBooksByAuthor(author, maxResults, sortOrder);
      results = [...results, ...googleResults.map(book => ({ ...book, apiSource: 'google' }))];
    }

    if (apiSource === ApiSource.RAKUTEN_BOOKS || apiSource === ApiSource.BOTH) {
      // 楽天APIの並び順パラメータは異なるため変換
      const rakutenSortOrder = sortOrder === 'newest' ? 'releaseDate' : 'standard';
      const rakutenResults = await rakutenBooksApi.searchBooksByAuthor(author, maxResults, rakutenSortOrder);
      results = [...results, ...rakutenResults.map(book => ({ ...book, apiSource: 'rakuten' }))];
    }

    // 重複を除去
    const uniqueResults = removeDuplicates(results);
    
    // 件数制限
    return uniqueResults.slice(0, maxResults);
  } catch (error) {
    console.error('本の検索エラー:', error);
    throw error;
  }
};

/**
 * ISBNから本の詳細情報を取得する（複数のAPIソースから）
 * @param {string} isbn - 検索するISBN
 * @param {string} apiSource - 使用するAPIソース
 * @returns {Promise} - 本の情報を含むPromise
 */
export const fetchBookByISBN = async (isbn, apiSource = ApiSource.BOTH) => {
  try {
    // ISBNでの検索は最初に一方のAPIで試し、結果がなければ他方のAPIを試す
    if (apiSource === ApiSource.GOOGLE_BOOKS || apiSource === ApiSource.BOTH) {
      const googleResult = await googleBooksApi.fetchBookByISBN(isbn);
      if (googleResult) {
        return { ...googleResult, apiSource: 'google' };
      }
    }

    if (apiSource === ApiSource.RAKUTEN_BOOKS || apiSource === ApiSource.BOTH) {
      const rakutenResult = await rakutenBooksApi.fetchBookByISBN(isbn);
      if (rakutenResult) {
        return { ...rakutenResult, apiSource: 'rakuten' };
      }
    }

    return null;
  } catch (error) {
    console.error('本の検索エラー:', error);
    throw error;
  }
};

/**
 * 配列の重複を除去する関数
 * @param {Array} books - 本のオブジェクト配列
 * @returns {Array} - 重複を除去した配列
 */
const removeDuplicates = (books) => {
  const uniqueBooks = new Map();
  
  books.forEach(book => {
    // ISBN13がある場合はそれをキーに、なければタイトルと著者の組み合わせをキーにする
    const key = book.isbn13 || `${book.title}-${book.authors?.join(',') || ''}`;
    
    // 既存のエントリがない、またはGoogleを優先する場合はエントリを追加/更新
    if (!uniqueBooks.has(key) || (book.apiSource === 'google' && uniqueBooks.get(key).apiSource !== 'google')) {
      uniqueBooks.set(key, book);
    }
  });
  
  return Array.from(uniqueBooks.values());
};