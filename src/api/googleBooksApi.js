// src/api/googleBooksApi.js
/**
 * Google Books APIを利用して本の情報を取得するモジュール
 */
const API_KEY = "AIzaSyBTbSN1fWg_3UYg1Rr1TZozTluDqTBgwcw";
const API_BASE_URL = 'https://www.googleapis.com/books/v1';

/**
 * ISBNから本の詳細情報を取得する
 * @param {string} isbn - 検索するISBN（10桁または13桁）
 * @returns {Promise} - 本の情報を含むPromise
 */
export const fetchBookByISBN = async (isbn) => {
  try {
    const response = await fetch(`${API_BASE_URL}/volumes?q=isbn:${isbn}`);
    const data = await response.json();
    
    if (data.totalItems === 0) {
      return null; // 本が見つからない場合
    }
    
    return processBookData(data.items[0]);
  } catch (error) {
    console.error('Google Books API呼び出しエラー:', error);
    throw error;
  }
};

/**
 * タイトルで本を検索する
 * @param {string} title - 検索するタイトル
 * @param {number} maxResults - 結果の最大数（デフォルト10）
 * @param {string} orderBy - 結果の並び順（'relevance' または 'newest'）
 * @returns {Promise} - 検索結果を含むPromise
 */
export const searchBooksByTitle = async (title, maxResults = 10, orderBy = 'newest') => {
  try {
    // 最大表示数を制限する（Google API制限が40）
    const actualMaxResults = Math.min(maxResults, 40);
    
    const response = await fetch(
      `${API_BASE_URL}/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=${actualMaxResults}&orderBy=${orderBy}&langRestrict=ja`
    );
    const data = await response.json();
    
    if (!data.items || data.totalItems === 0) {
      return []; // 本が見つからない場合
    }
    
    // ソート順を適用
    const results = data.items.map(processBookData);
    
    if (orderBy === 'newest') {
      // 発売日順にソート（新しい順）
      results.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB - dateA; // 降順（新しい順）
      });
    }
    
    return results;
  } catch (error) {
    console.error('Google Books API呼び出しエラー:', error);
    throw error;
  }
};

/**
 * 著者名で本を検索する
 * @param {string} author - 検索する著者名
 * @param {number} maxResults - 結果の最大数（デフォルト10）
 * @param {string} orderBy - 結果の並び順（'relevance' または 'newest'）
 * @returns {Promise} - 検索結果を含むPromise
 */
export const searchBooksByAuthor = async (author, maxResults = 10, orderBy = 'newest') => {
  try {
    // 最大表示数を制限する（Google API制限が40）
    const actualMaxResults = Math.min(maxResults, 40);
    
    const response = await fetch(
      `${API_BASE_URL}/volumes?q=inauthor:${encodeURIComponent(author)}&maxResults=${actualMaxResults}&orderBy=${orderBy}&langRestrict=ja`
    );
    const data = await response.json();
    
    if (!data.items || data.totalItems === 0) {
      return []; // 本が見つからない場合
    }
    
    // ソート順を適用
    const results = data.items.map(processBookData);
    
    if (orderBy === 'newest') {
      // 発売日順にソート（新しい順）
      results.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB - dateA; // 降順（新しい順）
      });
    }
    
    return results;
  } catch (error) {
    console.error('Google Books API呼び出しエラー:', error);
    throw error;
  }
};

/**
 * 複合検索（タイトル、著者、キーワードなど）
 * @param {Object} params - 検索パラメータ
 * @param {string} params.title - タイトル
 * @param {string} params.author - 著者
 * @param {string} params.publisher - 出版社
 * @param {string} params.subject - ジャンル/カテゴリ
 * @param {string} params.isbn - ISBN
 * @param {number} params.maxResults - 結果の最大数
 * @param {string} params.orderBy - 結果の並び順（'relevance' または 'newest'）
 * @returns {Promise} - 検索結果を含むPromise
 */
export const advancedBookSearch = async (params) => {
  let query = [];
  
  if (params.title) {
    query.push(`intitle:${encodeURIComponent(params.title)}`);
  }
  
  if (params.author) {
    query.push(`inauthor:${encodeURIComponent(params.author)}`);
  }
  
  if (params.publisher) {
    query.push(`inpublisher:${encodeURIComponent(params.publisher)}`);
  }
  
  if (params.subject) {
    query.push(`subject:${encodeURIComponent(params.subject)}`);
  }
  
  if (params.isbn) {
    query.push(`isbn:${params.isbn}`);
  }
  
  if (query.length === 0) {
    throw new Error('検索パラメータが指定されていません');
  }
  
  const queryString = query.join('+');
  const maxResults = Math.min(params.maxResults || 10, 40); // 最大表示数を制限
  const orderBy = params.orderBy || 'newest';
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/volumes?q=${queryString}&maxResults=${maxResults}&orderBy=${orderBy}&langRestrict=ja`
    );
    const data = await response.json();
    
    if (!data.items || data.totalItems === 0) {
      return [];
    }
    
    // ソート順を適用
    const results = data.items.map(processBookData);
    
    if (orderBy === 'newest') {
      // 発売日順にソート（新しい順）
      results.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB - dateA; // 降順（新しい順）
      });
    }
    
    return results;
  } catch (error) {
    console.error('Google Books API呼び出しエラー:', error);
    throw error;
  }
};

/**
 * Google Books APIの応答から必要なデータを抽出して整形する
 * @param {Object} bookItem - Google Books APIのレスポンスアイテム
 * @returns {Object} - 整形された本のデータ
 */
function processBookData(bookItem) {
  const volumeInfo = bookItem.volumeInfo || {};
  const imageLinks = volumeInfo.imageLinks || {};
  
  // ISBNを抽出
  let isbn10 = '';
  let isbn13 = '';
  
  if (volumeInfo.industryIdentifiers) {
    volumeInfo.industryIdentifiers.forEach(id => {
      if (id.type === 'ISBN_10') {
        isbn10 = id.identifier;
      } else if (id.type === 'ISBN_13') {
        isbn13 = id.identifier;
      }
    });
  }
  
  return {
    id: bookItem.id,
    title: volumeInfo.title || '',
    subtitle: volumeInfo.subtitle || '',
    authors: volumeInfo.authors || [],
    publisher: volumeInfo.publisher || '',
    publishedDate: volumeInfo.publishedDate || '',
    description: volumeInfo.description || '',
    pageCount: volumeInfo.pageCount || 0,
    categories: volumeInfo.categories || [],
    averageRating: volumeInfo.averageRating || 0,
    ratingsCount: volumeInfo.ratingsCount || 0,
    language: volumeInfo.language || '',
    isbn10: isbn10,
    isbn13: isbn13,
    coverImage: imageLinks.thumbnail || imageLinks.smallThumbnail || '',
    previewLink: volumeInfo.previewLink || '',
    infoLink: volumeInfo.infoLink || ''
  };
}