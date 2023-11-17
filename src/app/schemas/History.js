import mongoose from '../../database/index.mjs';

const HistorySchema = new mongoose.Schema({
  UserName: {
    type: String,
    required: true,
  },
  UserId: {
    type: String,
    required: true,
  },
  CarName: {
    type: String,
    required: true,
  },
  CarLicensePlate: {
    type: String,
    required: true,
  },
  CreatedAt: {
    type: Date,
    required: true,
  },
  EndedAt: {
    type: Date,
    default: Date.now,
  },
  CarPrice: {
    type: Number,
    required: true,
  },
  RentPrice: {
    type: Number,
  },
  KilometersDriven: {
    type: String,
    required: true,
  },
});

//Encontra a diferença entre a data de inicio do aluguel com a data de finalização
//Faz a conta para calcular o preço final do aluguel (dias * preço)
//Se a qtd de dias for menor que 1, o preço final será o preço do carro
/*HistorySchema.pre('save', function (next) {
  const StartDate = this.CreatedAt;
  const EndDate = this.EndedAt;

  const milliseconds = Math.abs(EndDate - StartDate);

  const days = Math.ceil(milliseconds / (1000 * 60 * 60 * 24));

  if (days < 1) {
    this.RentPrice = this.CarPrice;
  } else {
    this.RentPrice = days * this.CarPrice;
  }

  next();
});*/

export default mongoose.model('History', HistorySchema);
