//Describe -> bloco tests - tests suites
//IT or TEST ->  declara unico teste unitario - test cases
//EXPECT -> assercoes do resultado - validar resultados

const request = require('supertest');
const express = require('express');
const garageRouter = require('../Garage');
const app = express();
const { Cars } = require('../../schemas/Cars');

app.use(express.json());
app.use('/Garage', garageRouter);

describe('Testando rota /cars', () => {
  test('Deve retornar a lista de carros', async () => {
    const response = await request(app).get('/cars');

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);

    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('type');
    expect(response.body[0]).toHaveProperty('description');
    expect(response.body[0]).toHaveProperty('licensePlate');
    expect(response.body[0]).toHaveProperty('price');
    expect(response.body[0]).toHaveProperty('featuredImage');
  });

  test('Deve retornar erro 500 em caso de falha', async () => {
    jest.spyOn(Cars.prototype, 'find').mockImplementationOnce(() => {
      throw new Error('Erro simulado');
    });

    const response = await request(app).get('/cars');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Erro interno do servidor',
    });
  });
});
