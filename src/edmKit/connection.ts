/**
 * Created by grischa on 12/8/16.
 *
 * Get a connection to the Backend to run GraphQL query
 *
 */
/// <reference path="../types.d.ts" />
import {createNetworkInterface, default as ApolloClient} from "apollo-client";


export class EDMConnection extends ApolloClient {

    constructor(host: string, token: string) {
        token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6ODY1ZDBlMGYtYjM5NS00MzAyLTliZDgtNDAzZTAxODAxNmEyIiwiZXhwIjoxNDc5OTU2OTM1LCJpYXQiOjE0NzczNjQ5MzUsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNDkwY2FiN2EtM2E5MC00ODdhLWIzMGQtYWQxNmQwOGVhM2U2IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50Ojg2NWQwZTBmLWIzOTUtNDMwMi05YmQ4LTQwM2UwMTgwMTZhMiIsInR5cCI6InRva2VuIn0.LW5Ynprc5MwabHn2FRZcssou8D9R5QUDHMKzGjc4Ldjs7MZO8trOgIB1-SXX1WH7MIfJE9KfnMadHONE121OZw";
        token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6ZDM4ZmYzMWEtMGU2OC00NWVkLTg4ZWEtMGM0MDk2NjQwYWM5IiwiZXhwIjoxNDgwMDQ5MjY4LCJpYXQiOjE0Nzc0NTcyNjgsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNTY4N2M5ODgtNWEwNy00NjIyLWFkZGQtMTMxNzA0OGM2YjBlIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OmQzOGZmMzFhLTBlNjgtNDVlZC04OGVhLTBjNDA5NjY0MGFjOSIsInR5cCI6InRva2VuIn0.wXevW6L2z2B4tlpYu2zslnyauC6x6oA3QX3FUKDfBZ6EjDlWYsqANZWhINhQdRXUaO7adIi2yEBwtzg3ei4X8Q";
        token = "eyJraW5kIjoiQWNjZXNzVG9rZW4iLCJqdGkiOiJlYzc3NGQ4Yy0zMWU1LTQ1OTgtYTM5ZC0zZmIxZjMzYmNiOGIiLCJpYXQiOjE0NzkwOTMyNTUsImV4cCI6MTQ3OTEwMDQ1NSwiaXNzIjoiaHR0cDovLzEyNy4wLjAuMTo1MDAwL29wIn0.sHPRPRe3ZssEbRfarchykv1tHTJGplwEoUhj54-EJuCiI8Imt4YMn5eNYK54NYyTC0OzUwSUmcnCt09JIhloYIFH3a6nublFVobwQZyuwS77m056wbzIGgYICfJsZG2g4c_5MqjITP9KOTnWqrIlWiXCXGoFtrBnmH2KtBe71KNj8TiANx9jd7sOcx0jce6ohchV-rqdxsBXqBEuZKbKu7PCUCI38mXAcv_deJ_sQLl8AD1RMiBQJQoqFfidxty2myMStFTY9rVmaIp1qh55N3X4U-ZRpml4LfCj7p9xahYn1REiE9ARqNX8WjXM6LAlGgVj_zNF_gD7KkUtWjdzqGLXErCpeUVxV5nzoMwUc4BXocd7P5VGEFK-OOeRRKLfSM85g2GZC8_kfv4-EykpunxK4SUztm5pBrKijpDmYaSnCCz8a9vJASxVP2DqGAQbSDFu-s6LuSXnKsW4-yyxwoZ0xpBD_on4XQuo4O_s8X1d0RSEnrg7KcnVls-1-4oLr4jrBU6nhd_hYH0awFoUQ_LYkHrkcxljVwFDp6HLmf0IRKx-XASih4g6AlPdg1kz2Dastbpnej2u1vrDbQk2PX3mvHvBnGQW9_gtfrm9vomAtiPZPn3fldJ4Ju7ZoGEVw8t0Zo_lPiDvvWOSaf9cRoi6tNI4ra3u2RSKFncjvMw";
        const graphqlEndpoint = `http://${host}/api/v1/graphql`;
        const networkInterface = createNetworkInterface(graphqlEndpoint);
        networkInterface.use([{
            applyMiddleware(req, next) {
                if (!req.options.headers) {
                    req.options.headers = {};
                }
                req.options.headers["authorization"] = `Bearer ${token}`;
                next();
            }
        }]);

        super({networkInterface: networkInterface});
    }
}
