// src/api/ndlApi.js
/**
 * 国立国会図書館サーチAPIを利用して本の情報を取得するモジュール
 * https://iss.ndl.go.jp/information/api/
 */

const API_BASE_URL = 'https://iss.ndl.go.jp/api/opensearch';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

/**
 * XMLをパースしてJSON形式に変換する関数
 * @param {string} xmlString - NDLのレスポンスXML
 * @returns {Array} - 本の情報の配列
 */
const parseNdlXml = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const items = xmlDoc.getElementsByTagName("item");
  const results = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // タイトル
    const title = item.getElementsByTagName("title")[0]?.textContent || '';
    
    // 著者
    const dcCreator = item.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "creator");
    const authors = [];
    for (let j = 0; j < dcCreator.length; j++) {
      authors.push(dcCreator[j].textContent);
    }
    
    // 出版社
    const dcPublisher = item.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "publisher");
    const publisher = dcPublisher[0]?.textContent || '';
    
    // 出版日
    const dcDate = item.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "date");
    const publishedDate = dcDate[0]?.textContent || '';
    
    // 説明
    const description = item.getElementsByTagName("description")[0]?.textContent || '';
    
    // ISBN
    const isbn = item.getElementsByTagName("dc:identifier")
      .namedItem("ISBN")?.textContent || '';
    
    // カバー画像（NDLではデフォルトでは提供されていないため固定値）
    const coverImage = 'https://iss.ndl.go.jp/thumbnail/' + isbn;
    
    // ID (link URLから抽出)
    const link = item.getElementsByTagName("link")[0]?.textContent || '';
    const id = link.split('/').pop() || `ndl-${Date.now()}-${i}`;
    
    // 言語
    const dcLanguage = item.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "language");
    const language = dcLanguage[0]?.textContent || 'ja';
    
    // NDLの主題
    const dcSubject = item.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "subject");
    const categories = [];
    for (let j = 0; j < dcSubject.length; j++) {
      categories.push(dcSubject[j].textContent);
    }
    
    results.push({
      id,
      title: title.replace(" / ", "").trim(),
      subtitle: '',
      authors,
      publisher,
      publishedDate,
      description,
      pageCount: 0, // NDLのAPIでは提供されていない情報
      categories: categories.slice(0, 5),
      language,
      isbn10: isbn.length === 10 ? isbn : '',
      isbn13: isbn.length === 13 ? isbn : '',
      coverImage,
      previewLink: link,
      infoLink: link
    });
  }
  
  return results;
};

/**
 * ISBNから本の詳細情報を取得する
 * @param {string} isbn - 検索するISBN（10桁または13桁）
 * @returns {Promise<Object|null>} - 本の情報または null
 */
export const fetchBookByISBN = async (isbn) => {
  try {
    // ISBNの形式を整える（ハイフンなどを削除）
    const cleanedISBN = isbn.replace(/[^0-9X]/g, '');
    
    // NDL APIを使用してISBNで検索 (CORSプロキシ経由)
    const response = await fetch(`${CORS_PROXY}${API_BASE_URL}?cnt=1&isbn=${cleanedISBN}`);
    const xmlText = await response.text();
    
    // XMLをパースしてJSONに変換
    const books = parseNdlXml(xmlText);
    
    if (books.length === 0) {
      return null;
    }
    
    return books[0];
  } catch (error) {
    console.error('国立国会図書館API呼び出しエラー:', error);
    return null;
  }
};

/**
 * タイトルで本を検索する
 * @param {string} title - 検索するタイトル
 * @param {number} maxResults - 結果の最大数
 * @returns {Promise<Array>} - 検索結果の配列
 */
export const searchBooksByTitle = async (title, maxResults = 20) => {
  try {
    // NDL APIでタイトル検索（any=titleかtitle=titleでも可）(CORSプロキシ経由)
    const response = await fetch(
      `${CORS_PROXY}${API_BASE_URL}?cnt=${maxResults}&title=${encodeURIComponent(title)}`
    );
    const xmlText = await response.text();
    
    // XMLをパースしてJSONに変換
    const books = parseNdlXml(xmlText);
    
    // 日付順にソート（新しい順）
    books.sort((a, b) => {
      const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
      const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
      return dateB - dateA;
    });
    
    return books;
  } catch (error) {
    console.error('国立国会図書館API呼び出しエラー:', error);
    return [];
  }
};

/**
 * 著者名で本を検索する
 * @param {string} author - 検索する著者名
 * @param {number} maxResults - 結果の最大数
 * @returns {Promise<Array>} - 検索結果の配列
 */
export const searchBooksByAuthor = async (author, maxResults = 20) => {
  try {
    // NDL APIで著者検索 (CORSプロキシ経由)
    const response = await fetch(
      `${CORS_PROXY}${API_BASE_URL}?cnt=${maxResults}&creator=${encodeURIComponent(author)}`
    );
    const xmlText = await response.text();
    
    // XMLをパースしてJSONに変換
    const books = parseNdlXml(xmlText);
    
    // 日付順にソート（新しい順）
    books.sort((a, b) => {
      const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
      const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
      return dateB - dateA;
    });
    
    return books;
  } catch (error) {
    console.error('国立国会図書館API呼び出しエラー:', error);
    return [];
  }
};