// src/api/rakutenBooksApi.js
const API_BASE_URL = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
const APP_ID = process.env.REACT_APP_RAKUTEN_APP_ID || '1089567647677422356';

/**
 * タイトルで本を検索する
 * @param {string} title - 検索するタイトル
 * @param {number} maxResults - 結果の最大数（デフォルト20）
 * @param {string} sortOrder - 結果の並び順（'standard'または'sales'）
 * @returns {Promise} - 検索結果を含むPromise
 */
export const searchBooksByTitle = async (title, maxResults = 20, sortOrder = 'standard') => {
  try {
    // sortOrderの変換ロジック
    let validSortOrder;
    switch (sortOrder) {
      case 'newest':
      case 'releaseDate':
        validSortOrder = '-releaseDate'; // マイナス記号で降順（新しい順）
        break;
      case 'relevance':
        validSortOrder = 'standard';
        break;
      default:
        validSortOrder = 'standard';
    }
    
    const url = `${API_BASE_URL}?applicationId=${APP_ID}&title=${encodeURIComponent(title)}&hits=${maxResults}&sort=${validSortOrder}`;
    console.log('Rakuten API request URL:', url);
    
    const response = await fetch(url);
    console.log('Rakuten API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Rakuten API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Rakuten API response data:', data);
    
    if (!data.Items || data.Items.length === 0) {
      return [];
    }
    
    // 楽天APIのレスポンスを標準形式に変換
    return data.Items.map(item => {
      const book = item.Item;
      return {
        id: book.isbn || String(Math.random()),
        title: book.title,
        subtitle: '',
        authors: book.author ? [book.author] : [],
        publisher: book.publisherName || '',
        publishedDate: book.salesDate || '',
        description: book.itemCaption || '',
        pageCount: book.size ? parseInt(book.size) : 0,
        categories: [],
        language: 'ja',
        isbn10: '',
        isbn13: book.isbn || '',
        coverImage: book.largeImageUrl || book.mediumImageUrl || '',
        previewLink: book.itemUrl || '',
        infoLink: book.itemUrl || '',
      };
    });
  } catch (error) {
    console.error('楽天ブックスAPI呼び出しエラー:', error);
    throw error;
  }
};

/**
 * 著者名で本を検索する
 * @param {string} author - 検索する著者名
 * @param {number} maxResults - 結果の最大数（デフォルト20）
 * @param {string} sortOrder - 結果の並び順（'standard'または'sales'）
 * @returns {Promise} - 検索結果を含むPromise
 */
export const searchBooksByAuthor = async (author, maxResults = 20, sortOrder = 'standard') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}?applicationId=${APP_ID}&author=${encodeURIComponent(author)}&hits=${maxResults}&sort=${sortOrder}`
    );
    
    const data = await response.json();
    
    if (!data.Items || data.Items.length === 0) {
      return [];
    }
    
    // 楽天APIのレスポンスを標準形式に変換
    return data.Items.map(item => {
      const book = item.Item;
      return {
        id: book.isbn || String(Math.random()),
        title: book.title,
        subtitle: '',
        authors: book.author ? [book.author] : [],
        publisher: book.publisherName || '',
        publishedDate: book.salesDate || '',
        description: book.itemCaption || '',
        pageCount: book.size ? parseInt(book.size) : 0,
        categories: [],
        language: 'ja',
        isbn10: '',
        isbn13: book.isbn || '',
        coverImage: book.largeImageUrl || book.mediumImageUrl || '',
        previewLink: book.itemUrl || '',
        infoLink: book.itemUrl || '',
      };
    });
  } catch (error) {
    console.error('楽天ブックスAPI呼び出しエラー:', error);
    throw error;
  }
};

/**
 * ISBNから本の詳細情報を取得する
 * @param {string} isbn - 検索するISBN
 * @returns {Promise} - 本の情報を含むPromise
 */
export const fetchBookByISBN = async (isbn) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}?applicationId=${APP_ID}&isbn=${isbn}`
    );
    
    const data = await response.json();
    
    if (!data.Items || data.Items.length === 0) {
      return null;
    }
    
    const book = data.Items[0].Item;
    return {
      id: book.isbn || String(Math.random()),
      title: book.title,
      subtitle: '',
      authors: book.author ? [book.author] : [],
      publisher: book.publisherName || '',
      publishedDate: book.salesDate || '',
      description: book.itemCaption || '',
      pageCount: book.size ? parseInt(book.size) : 0,
      categories: [],
      language: 'ja',
      isbn10: '',
      isbn13: book.isbn || '',
      coverImage: book.largeImageUrl || book.mediumImageUrl || '',
      previewLink: book.itemUrl || '',
      infoLink: book.itemUrl || '',
    };
  } catch (error) {
    console.error('楽天ブックスAPI呼び出しエラー:', error);
    throw error;
  }
};